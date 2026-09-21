<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\InterventionAssignment;
use App\Models\MasteryCycle;
use App\Models\Section;
use App\Models\Topic;
use App\Services\AuditLogService;
use App\Services\GradingPolicyService;
use App\Services\InstructionalWorkflowService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class WorkflowController extends Controller
{
    public function index(
        Request $request,
        InstructionalWorkflowService $workflowService,
        GradingPolicyService $policyService
    ): View
    {
        $teacher = $request->user();
        $allowedSectionIds = $this->allowedSectionIds($teacher);

        $sections = Section::query()
            ->when($allowedSectionIds->isNotEmpty(), fn ($query) => $query->whereIn('id', $allowedSectionIds))
            ->orderBy('name')
            ->get(['id', 'name']);

        $topics = Topic::query()->with('lesson:id,title,subject')->orderBy('title')->get(['id', 'lesson_id', 'title']);

        $selectedSectionId = $request->query('section_id');
        $selectedTopicId = $request->query('topic_id');
        $topic = $selectedTopicId ? Topic::query()->with('lesson')->find((int) $selectedTopicId) : null;
        $resolvedPolicy = null;
        if ($selectedSectionId) {
            $resolvedPolicy = $policyService->resolve((int) $selectedSectionId, $topic?->lesson?->subject);
        }

        $filters = [
            'section_id' => $selectedSectionId,
            'topic_id' => $selectedTopicId,
            'mastery_threshold' => (float) $request->query('mastery_threshold', (float) ($resolvedPolicy['mastery_threshold'] ?? 75)),
            'attainment_threshold' => (float) $request->query('attainment_threshold', (float) ($resolvedPolicy['attainment_threshold'] ?? 80)),
            'date_from' => $request->query('date_from', now()->subDays(14)->toDateString()),
            'date_to' => $request->query('date_to', now()->toDateString()),
        ];

        $snapshot = null;
        if ($filters['section_id'] && $filters['topic_id']) {
            $snapshot = $workflowService->masterySnapshot(
                (int) $filters['section_id'],
                (int) $filters['topic_id'],
                (float) $filters['mastery_threshold'],
                (float) $filters['attainment_threshold'],
                (string) $filters['date_from'],
                (string) $filters['date_to']
            );
        }

        $recentCycles = MasteryCycle::query()
            ->where('teacher_id', $teacher->id)
            ->with(['section', 'topic.lesson'])
            ->latest('evaluated_at')
            ->take(8)
            ->get();

        $interventions = InterventionAssignment::query()
            ->where('teacher_id', $teacher->id)
            ->with(['student', 'section', 'topic.lesson', 'masteryCycle'])
            ->latest('assigned_at')
            ->take(20)
            ->get();

        return view('teacher.workflow.index', [
            'sections' => $sections,
            'topics' => $topics,
            'filters' => $filters,
            'snapshot' => $snapshot,
            'recentCycles' => $recentCycles,
            'interventions' => $interventions,
            'resolvedPolicy' => $resolvedPolicy,
        ]);
    }

    public function evaluate(
        Request $request,
        InstructionalWorkflowService $workflowService,
        AuditLogService $auditLogService
    ): RedirectResponse
    {
        $validated = $request->validate([
            'section_id' => ['required', 'integer', Rule::exists('sections', 'id')],
            'topic_id' => ['required', 'integer', Rule::exists('topics', 'id')],
            'mastery_threshold' => ['nullable', 'numeric', 'min:50', 'max:100'],
            'attainment_threshold' => ['nullable', 'numeric', 'min:50', 'max:100'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $cycle = $workflowService->evaluateAndStoreCycle($request->user(), $validated);
        $decisionLabel = $cycle->decision === 'proceed' ? 'Proceed to next lesson.' : 'Reteach required.';
        $auditLogService->log(
            $request->user(),
            'teacher.workflow.evaluated',
            'mastery_cycle',
            $cycle->id,
            [
                'section_id' => $cycle->section_id,
                'topic_id' => $cycle->topic_id,
                'decision' => $cycle->decision,
                'class_attainment' => (float) $cycle->class_attainment,
            ],
            $request
        );

        return redirect()
            ->route('teacher.workflow.index', [
                'section_id' => $validated['section_id'],
                'topic_id' => $validated['topic_id'],
                'mastery_threshold' => $validated['mastery_threshold'] ?? null,
                'attainment_threshold' => $validated['attainment_threshold'] ?? null,
                'date_from' => $validated['date_from'] ?? null,
                'date_to' => $validated['date_to'] ?? null,
            ])
            ->with('status', 'Mastery evaluated. '.$decisionLabel);
    }

    public function logReteach(
        Request $request,
        MasteryCycle $cycle,
        InstructionalWorkflowService $workflowService,
        AuditLogService $auditLogService
    ): RedirectResponse
    {
        if ((int) $cycle->teacher_id !== (int) $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'reteach_strategy' => ['required', 'string', 'max:255'],
            'reteach_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $workflowService->recordReteach(
            $cycle,
            (string) $validated['reteach_strategy'],
            $validated['reteach_notes'] ?? null
        );
        $auditLogService->log(
            $request->user(),
            'teacher.workflow.reteach_logged',
            'mastery_cycle',
            $cycle->id,
            [
                'reteach_strategy' => $validated['reteach_strategy'],
            ],
            $request
        );

        return redirect()->route('teacher.workflow.index')->with('status', 'Reteach cycle logged successfully.');
    }

    public function updateIntervention(
        Request $request,
        InterventionAssignment $intervention,
        InstructionalWorkflowService $workflowService,
        AuditLogService $auditLogService
    ): RedirectResponse {
        if ((int) $intervention->teacher_id !== (int) $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['assigned', 'in_progress', 'completed'])],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $workflowService->updateInterventionStatus(
            $intervention,
            (string) $validated['status'],
            $validated['notes'] ?? null
        );
        $auditLogService->log(
            $request->user(),
            'teacher.intervention.updated',
            'intervention_assignment',
            $intervention->id,
            [
                'status' => $validated['status'],
            ],
            $request
        );

        return redirect()->route('teacher.workflow.index')->with('status', 'Intervention updated.');
    }

    private function allowedSectionIds($teacher): Collection
    {
        return $teacher->handledSections()->pluck('sections.id');
    }
}
