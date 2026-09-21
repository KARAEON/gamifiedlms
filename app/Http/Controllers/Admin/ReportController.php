<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AdminReportSubmission;
use App\Models\ReportDelivery;
use App\Models\Section;
use App\Models\User;
use App\Services\AdminAnalyticsService;
use App\Services\AuditLogService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(): View
    {
        return view('admin.reports.index', [
            'submissions' => AdminReportSubmission::query()
                ->with('submitter:id,name')
                ->latest('submitted_at')
                ->paginate(12),
            'sections' => Section::query()->orderBy('name')->get(['id', 'name']),
            'teachers' => User::query()->where('role', UserRole::TEACHER)->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'teacherReportSubmissions' => ReportDelivery::query()
                ->where('target_role', 'admin')
                ->with([
                    'report:id,title,report_type,generated_by,generated_at,section_id,student_id',
                    'report.teacher:id,name',
                    'report.section:id,name',
                    'report.student:id,name',
                    'submitter:id,name',
                    'acknowledger:id,name',
                ])
                ->latest('submitted_at')
                ->paginate(12, ['*'], 'teacher_submissions_page'),
        ]);
    }

    public function download(
        Request $request,
        AdminAnalyticsService $analyticsService,
        AuditLogService $auditLogService
    ): Response|StreamedResponse|View
    {
        $validated = $request->validate([
            'report_scope' => ['required', Rule::in(['subject', 'class', 'teacher', 'quarterly'])],
            'format' => ['nullable', Rule::in(['csv', 'pdf', 'view'])],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'section_id' => ['nullable', 'integer', Rule::exists('sections', 'id')],
            'teacher_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'subject' => ['nullable', 'string', 'max:100'],
            'grade_keyword' => ['nullable', 'string', 'max:100'],
        ]);

        [$headers, $rows, $slug] = $analyticsService->reportDataset((string) $validated['report_scope'], $validated);
        $format = (string) ($validated['format'] ?? 'csv');
        $filename = 'admin-'.$slug.'-'.now()->format('Ymd_His').'.csv';
        $auditLogService->log(
            $request->user(),
            'admin.report.downloaded',
            'admin_report',
            null,
            [
                'scope' => $validated['report_scope'],
                'format' => $format,
                'filename' => $filename,
            ],
            $request
        );

        if ($format === 'view') {
            return view('admin.reports.preview', [
                'scope' => (string) $validated['report_scope'],
                'headers' => $headers,
                'rows' => $rows,
                'filters' => $validated,
            ]);
        }

        if ($format === 'pdf' && class_exists(Pdf::class)) {
            $pdf = Pdf::loadView('admin.reports.printable', [
                'scope' => (string) $validated['report_scope'],
                'headers' => $headers,
                'rows' => $rows,
                'filters' => $validated,
                'generatedAt' => now(),
            ]);

            return $pdf->download(str_replace('.csv', '.pdf', $filename));
        }

        return response()->streamDownload(function () use ($headers, $rows): void {
            $handle = fopen('php://output', 'wb');
            fputcsv($handle, $headers);
            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function submit(Request $request, AuditLogService $auditLogService): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validate([
            'report_scope' => ['required', Rule::in(['subject', 'class', 'teacher', 'quarterly'])],
            'scope_reference' => ['nullable', 'string', 'max:180'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'destination' => ['nullable', 'string', 'max:180'],
            'remarks' => ['nullable', 'string', 'max:600'],
        ]);

        $submission = AdminReportSubmission::query()->create([
            'submitted_by' => $request->user()->id,
            'report_scope' => $validated['report_scope'],
            'scope_reference' => $validated['scope_reference'] ?? null,
            'date_from' => $validated['date_from'] ?? null,
            'date_to' => $validated['date_to'] ?? null,
            'destination' => $validated['destination'] ?? null,
            'status' => 'submitted',
            'submitted_at' => now(),
            'remarks' => $validated['remarks'] ?? null,
        ]);
        $auditLogService->log(
            $request->user(),
            'admin.report.submitted',
            'admin_report_submission',
            $submission->id,
            [
                'scope' => $submission->report_scope,
                'destination' => $submission->destination,
            ],
            $request
        );

        return redirect()->route('admin.reports.index')->with('status', Str::headline($validated['report_scope']).' report submission logged.');
    }

    public function acknowledgeTeacherSubmission(
        Request $request,
        ReportDelivery $delivery,
        AuditLogService $auditLogService
    ): \Illuminate\Http\RedirectResponse {
        if ($delivery->target_role !== 'admin') {
            abort(404);
        }

        $validated = $request->validate([
            'admin_note' => ['nullable', 'string', 'max:600'],
        ]);

        if ($delivery->status === 'acknowledged') {
            return redirect()->route('admin.reports.index')->with('status', 'Submission already acknowledged.');
        }

        $delivery->update([
            'status' => 'acknowledged',
            'acknowledged_by' => $request->user()->id,
            'acknowledged_at' => now(),
            'admin_note' => $validated['admin_note'] ?? null,
        ]);

        $auditLogService->log(
            $request->user(),
            'admin.teacher_report.acknowledged',
            'report_delivery',
            $delivery->id,
            [
                'report_id' => $delivery->report_id,
                'submitted_by' => $delivery->submitted_by,
            ],
            $request
        );

        return redirect()->route('admin.reports.index')->with('status', 'Teacher report submission acknowledged.');
    }
}
