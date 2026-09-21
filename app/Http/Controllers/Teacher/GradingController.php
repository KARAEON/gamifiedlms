<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\GradeEntry;
use App\Models\Section;
use App\Models\User;
use App\Services\GradeComputationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class GradingController extends Controller
{
    public function index(Request $request, GradeComputationService $gradeComputationService): View
    {
        $teacher = $request->user();
        $allowedSectionIds = $teacher->handledSections()->pluck('sections.id');

        $sections = Section::query()
            ->when($allowedSectionIds->isNotEmpty(), fn ($builder) => $builder->whereIn('id', $allowedSectionIds))
            ->orderBy('name')
            ->get(['id', 'name']);

        $subject = (string) $request->query('subject', 'English');
        $quarter = (int) $request->query('quarter', 1);
        $sectionId = (int) $request->query('section_id', ($sections->first()->id ?? 0));

        $students = User::query()
            ->where('role', \App\Enums\UserRole::STUDENT)
            ->whereHas('studentProfile', fn ($builder) => $builder->where('section_id', $sectionId))
            ->orderBy('name')
            ->get(['id', 'name']);

        $existingEntries = Schema::hasTable('grade_entries')
            ? GradeEntry::query()
                ->where('section_id', $sectionId)
                ->where('subject', $subject)
                ->where('quarter', $quarter)
                ->get()
                ->keyBy('student_id')
            : collect();

        $gradeRows = $students->map(function (User $student) use ($gradeComputationService, $subject, $quarter, $existingEntries): array {
            return [
                'student' => $student,
                'entry' => $existingEntries->get($student->id),
                'computed' => $gradeComputationService->computeForStudentSubjectQuarter($student, $subject, $quarter),
            ];
        });

        return view('teacher.grading.index', [
            'sections' => $sections,
            'subjects' => $gradeComputationService->supportedSubjects(),
            'selectedSectionId' => $sectionId,
            'selectedSubject' => $subject,
            'selectedQuarter' => $quarter,
            'gradeRows' => $gradeRows,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'section_id' => ['required', 'integer', Rule::exists('sections', 'id')],
            'subject' => ['required', Rule::in(['English', 'Mathematics', 'Science'])],
            'quarter' => ['required', 'integer', 'between:1,4'],
            'performance_task_items' => ['nullable', 'array'],
            'performance_task_items.*' => ['nullable', 'numeric', 'min:0'],
            'performance_task_hps_items' => ['nullable', 'array'],
            'performance_task_hps_items.*' => ['nullable', 'numeric', 'min:0'],
            'performance_task_score' => ['nullable', 'numeric', 'min:0'],
            'performance_task_hps' => ['nullable', 'numeric', 'min:0'],
            'quarterly_assessment_score' => ['nullable', 'numeric', 'min:0'],
            'quarterly_assessment_hps' => ['nullable', 'numeric', 'min:0'],
        ]);

        $ptItems = collect($validated['performance_task_items'] ?? [])->take(10)->pad(10, null)->values()->all();
        $ptHpsItems = collect($validated['performance_task_hps_items'] ?? [])->take(10)->pad(10, null)->values()->all();
        $ptTotal = collect($ptItems)->filter(fn ($value) => $value !== null && $value !== '')->sum();
        $ptHpsTotal = collect($ptHpsItems)->filter(fn ($value) => $value !== null && $value !== '')->sum();

        GradeEntry::query()->updateOrCreate(
            [
                'student_id' => $validated['student_id'],
                'section_id' => $validated['section_id'],
                'subject' => $validated['subject'],
                'quarter' => $validated['quarter'],
            ],
            [
                'performance_task_items' => $ptItems,
                'performance_task_hps_items' => $ptHpsItems,
                'performance_task_score' => $ptTotal > 0 ? $ptTotal : ($validated['performance_task_score'] ?? null),
                'performance_task_hps' => $ptHpsTotal > 0 ? $ptHpsTotal : ($validated['performance_task_hps'] ?? null),
                'quarterly_assessment_score' => $validated['quarterly_assessment_score'] ?? null,
                'quarterly_assessment_hps' => $validated['quarterly_assessment_hps'] ?? null,
                'updated_by' => $request->user()->id,
            ]
        );

        return redirect()->route('teacher.grading.index', [
            'section_id' => $validated['section_id'],
            'subject' => $validated['subject'],
            'quarter' => $validated['quarter'],
        ])->with('status', 'Grading inputs saved successfully.');
    }
}