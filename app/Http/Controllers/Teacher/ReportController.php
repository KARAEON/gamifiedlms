<?php

namespace App\Http\Controllers\Teacher;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\ReportDelivery;
use App\Models\Section;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(): View
    {
        $teacher = request()->user();

        return view('teacher.reports.index', [
            'reports' => Report::query()
                ->where('generated_by', $teacher->id)
                ->with(['student', 'section', 'latestSchoolHeadDelivery'])
                ->latest('generated_at')
                ->paginate(10),
            'students' => User::query()->where('role', UserRole::STUDENT)->orderBy('name')->get(['id', 'name']),
            'sections' => Section::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function generate(
        Request $request,
        ReportService $reportService,
        AuditLogService $auditLogService
    ): Response|StreamedResponse|View
    {
        $validated = $request->validate([
            'report_type' => ['required', Rule::in(['student', 'section', 'summary'])],
            'format' => ['required', Rule::in(['view', 'pdf', 'csv'])],
            'student_id' => [
                'nullable',
                'integer',
                'required_if:report_type,student',
                Rule::exists('users', 'id')->where('role', UserRole::STUDENT->value),
            ],
            'section_id' => ['nullable', 'integer', 'required_if:report_type,section', Rule::exists('sections', 'id')],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
        ]);

        $filters = array_filter([
            'date_from' => $validated['date_from'] ?? null,
            'date_to' => $validated['date_to'] ?? null,
            'student_id' => $validated['student_id'] ?? null,
            'section_id' => $validated['section_id'] ?? null,
        ]);

        $reportType = (string) $validated['report_type'];
        $format = (string) $validated['format'];

        $payload = [];
        $title = '';
        $student = null;
        $section = null;

        if ($reportType === 'student') {
            $student = User::query()->where('role', UserRole::STUDENT)->findOrFail((int) $validated['student_id']);
            $payload = $reportService->buildStudentReport($student, $filters);
            $title = "Student Performance Report - {$student->name}";
        } elseif ($reportType === 'section') {
            $section = Section::query()->findOrFail((int) $validated['section_id']);
            $payload = $reportService->buildSectionReport($section, $filters);
            $title = "Section Performance Report - {$section->name}";
        } else {
            $payload = [
                'summary' => $reportService->buildSummaryAnalytics($filters),
                'remarks' => 'Prioritize high risk section-topic pairs and align intervention schedules by urgency.',
            ];
            $title = 'Summary Analytics Report';
        }

        $reportService->logGeneratedReport(
            $request->user(),
            $reportType,
            $title,
            $filters,
            $student?->id,
            $section?->id
        );
        $auditLogService->log(
            $request->user(),
            'teacher.report.generated',
            'report',
            null,
            [
                'report_type' => $reportType,
                'format' => $format,
                'title' => $title,
            ],
            $request
        );

        if ($format === 'csv') {
            return $this->downloadCsv($title, $reportType, $payload);
        }

        if ($format === 'pdf' && class_exists(Pdf::class)) {
            $pdf = Pdf::loadView('teacher.reports.printable', [
                'title' => $title,
                'reportType' => $reportType,
                'payload' => $payload,
                'student' => $student,
                'section' => $section,
                'filters' => $filters,
                'generatedAt' => now(),
            ]);

            return $pdf->download(Str::slug($title).'.pdf');
        }

        return view('teacher.reports.preview', [
            'title' => $title,
            'reportType' => $reportType,
            'payload' => $payload,
            'student' => $student,
            'section' => $section,
            'filters' => $filters,
            'generatedAt' => now(),
        ]);
    }

    public function submitToSchoolHead(Request $request, Report $report, AuditLogService $auditLogService): \Illuminate\Http\RedirectResponse
    {
        if ((int) $report->generated_by !== (int) $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'teacher_note' => ['nullable', 'string', 'max:600'],
        ]);

        $existingOpen = ReportDelivery::query()
            ->where('report_id', $report->id)
            ->where('target_role', 'admin')
            ->where('status', 'submitted')
            ->exists();

        if ($existingOpen) {
            return redirect()->route('teacher.reports.index')->with('status', 'This report is already submitted to school head and awaiting review.');
        }

        $delivery = ReportDelivery::query()->create([
            'report_id' => $report->id,
            'submitted_by' => $request->user()->id,
            'target_role' => 'admin',
            'status' => 'submitted',
            'submitted_at' => now(),
            'teacher_note' => $validated['teacher_note'] ?? null,
        ]);

        $auditLogService->log(
            $request->user(),
            'teacher.report.submitted_to_school_head',
            'report_delivery',
            $delivery->id,
            [
                'report_id' => $report->id,
                'report_type' => $report->report_type,
            ],
            $request
        );

        return redirect()->route('teacher.reports.index')->with('status', 'Report submitted to school head successfully.');
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function downloadCsv(string $title, string $reportType, array $payload): StreamedResponse
    {
        $filename = Str::slug($title).'.csv';
        $rows = $this->rowsForCsv($reportType, $payload);

        return response()->streamDownload(function () use ($rows): void {
            $stream = fopen('php://output', 'wb');
            if ($stream === false) {
                return;
            }

            foreach ($rows as $row) {
                fputcsv($stream, $row);
            }

            fclose($stream);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<int, array<int, string|int|float|null>>
     */
    protected function rowsForCsv(string $reportType, array $payload): array
    {
        if ($reportType === 'student') {
            $rows = [['Lesson', 'Topic', 'Activity', 'Score', 'Max Score', 'Accuracy', 'Date']];

            foreach ($payload['records'] as $record) {
                $rows[] = [
                    $record->lesson?->title,
                    $record->topic?->title,
                    $record->activity?->title,
                    (float) $record->score,
                    (float) $record->max_score,
                    (float) $record->accuracy,
                    optional($record->attempted_at)->toDateString(),
                ];
            }

            return $rows;
        }

        if ($reportType === 'section') {
            $rows = [['Student', 'Lesson', 'Topic', 'Activity', 'Accuracy', 'Date']];
            foreach ($payload['records'] as $record) {
                $rows[] = [
                    $record->student?->name,
                    $record->lesson?->title,
                    $record->topic?->title,
                    $record->activity?->title,
                    (float) $record->accuracy,
                    optional($record->attempted_at)->toDateString(),
                ];
            }

            $rows[] = [];
            $rows[] = ['Intervention Targets'];
            $rows[] = ['Student', 'Average Accuracy', 'Attempts', 'Low Score Rate'];
            foreach ($payload['intervention_targets'] as $target) {
                $rows[] = [
                    $target['student'],
                    $target['average'],
                    $target['attempts'],
                    $target['low_score_rate'],
                ];
            }

            return $rows;
        }

        $rows = [['Lesson', 'Topic', 'Section', 'Average Accuracy', 'Completion Rate', 'Risk Index', 'Attempts']];
        /** @var Collection $summary */
        $summary = $payload['summary'];
        foreach ($summary as $row) {
            $rows[] = [
                $row['lesson'],
                $row['topic'],
                $row['section'],
                $row['average_accuracy'],
                $row['completion_rate'],
                $row['risk_index'],
                $row['total_attempts'],
            ];
        }

        return $rows;
    }
}
