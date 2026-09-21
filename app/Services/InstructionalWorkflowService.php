<?php

namespace App\Services;

use App\Enums\ActivityPhase;
use App\Models\InterventionAssignment;
use App\Models\MasteryCycle;
use App\Models\ScoreRecord;
use App\Models\Section;
use App\Models\Topic;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class InstructionalWorkflowService
{
    public function __construct(
        protected GradingPolicyService $gradingPolicyService,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function masterySnapshot(
        int $sectionId,
        int $topicId,
        ?float $masteryThreshold = null,
        ?float $attainmentThreshold = null,
        ?string $dateFrom = null,
        ?string $dateTo = null
    ): array {
        $section = Section::query()->with(['students.user'])->findOrFail($sectionId);
        $topic = Topic::query()->with('lesson')->findOrFail($topicId);
        $policy = $this->gradingPolicyService->resolve($sectionId, $topic->lesson?->subject);
        $resolvedMasteryThreshold = $masteryThreshold ?? (float) $policy['mastery_threshold'];
        $resolvedAttainmentThreshold = $attainmentThreshold ?? (float) $policy['attainment_threshold'];

        $activeProfiles = $section->students
            ->filter(fn ($profile): bool => (bool) $profile->user?->is_active)
            ->values();
        $studentIds = $activeProfiles
            ->pluck('user_id')
            ->filter()
            ->map(static fn ($id): int => (int) $id)
            ->values();

        $records = $this->instructionEvidenceRecords($sectionId, $topicId, $studentIds, $dateFrom, $dateTo)
            ->with('activity:id,instructional_phase')
            ->get();
        $studentMetrics = $this->buildStudentMetrics($activeProfiles, $records, $resolvedMasteryThreshold, $policy);

        $classSize = $studentMetrics->count();
        $studentsMastered = $studentMetrics->where('mastery_pct', '>=', $resolvedMasteryThreshold)->count();
        $classAttainment = $classSize > 0 ? round(($studentsMastered / $classSize) * 100, 2) : 0.0;
        $decision = $classAttainment >= $resolvedAttainmentThreshold ? 'proceed' : 'reteach';

        $currentWeek = $this->weeklySummativeStats($sectionId, $topicId, null, (bool) $policy['weekly_summative_required']);

        return [
            'section' => $section,
            'topic' => $topic,
            'lesson' => $topic->lesson,
            'mastery_threshold' => $resolvedMasteryThreshold,
            'attainment_threshold' => $resolvedAttainmentThreshold,
            'policy' => $policy,
            'class_size' => $classSize,
            'students_mastered' => $studentsMastered,
            'class_attainment' => $classAttainment,
            'decision' => $decision,
            'requires_reteach' => $decision === 'reteach',
            'student_metrics' => $studentMetrics,
            'low_performers' => $studentMetrics->where('mastery_pct', '<', $resolvedMasteryThreshold)->values(),
            'high_performers' => $studentMetrics->where('mastery_pct', '>=', 90)->values(),
            'weekly_summative' => $currentWeek,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function evaluateAndStoreCycle(User $teacher, array $payload): MasteryCycle
    {
        $sectionId = (int) $payload['section_id'];
        $topicId = (int) $payload['topic_id'];
        $masteryThreshold = isset($payload['mastery_threshold']) ? (float) $payload['mastery_threshold'] : null;
        $attainmentThreshold = isset($payload['attainment_threshold']) ? (float) $payload['attainment_threshold'] : null;
        $dateFrom = $payload['date_from'] ?? null;
        $dateTo = $payload['date_to'] ?? null;

        $snapshot = $this->masterySnapshot(
            $sectionId,
            $topicId,
            $masteryThreshold,
            $attainmentThreshold,
            is_string($dateFrom) ? $dateFrom : null,
            is_string($dateTo) ? $dateTo : null
        );

        return DB::transaction(function () use ($teacher, $snapshot): MasteryCycle {
            $cycle = MasteryCycle::query()->create([
                'teacher_id' => $teacher->id,
                'section_id' => $snapshot['section']->id,
                'lesson_id' => $snapshot['lesson']?->id,
                'topic_id' => $snapshot['topic']->id,
                'class_size' => $snapshot['class_size'],
                'students_mastered' => $snapshot['students_mastered'],
                'class_attainment' => $snapshot['class_attainment'],
                'mastery_threshold' => $snapshot['mastery_threshold'],
                'attainment_threshold' => $snapshot['attainment_threshold'],
                'decision' => $snapshot['decision'],
                'requires_reteach' => $snapshot['requires_reteach'],
                'weekly_summative_attempts' => $snapshot['weekly_summative']['attempts'],
                'weekly_summative_mps' => $snapshot['weekly_summative']['mps'],
                'evaluated_at' => now(),
            ]);

            $this->createInterventionsFromSnapshot($cycle, $snapshot['student_metrics']);

            return $cycle->fresh(['section', 'topic.lesson', 'interventions.student']);
        });
    }

    public function recordReteach(MasteryCycle $cycle, string $strategy, ?string $notes = null): MasteryCycle
    {
        $cycle->update([
            'reteach_attempts' => $cycle->reteach_attempts + 1,
            'reteach_strategy' => $strategy,
            'reteach_notes' => $notes,
            'reteach_completed_at' => now(),
            'requires_reteach' => false,
        ]);

        return $cycle->fresh(['section', 'topic.lesson']);
    }

    public function updateInterventionStatus(InterventionAssignment $assignment, string $status, ?string $notes = null): InterventionAssignment
    {
        $payload = [
            'status' => $status,
            'notes' => $notes,
        ];

        if ($status === 'completed') {
            $payload['completed_at'] = now();
        }

        $assignment->update($payload);

        return $assignment->fresh(['student', 'section', 'topic']);
    }

    /**
     * @param  Collection<int, int>  $studentIds
     * @return Builder<ScoreRecord>
     */
    protected function instructionEvidenceRecords(
        int $sectionId,
        int $topicId,
        Collection $studentIds,
        ?string $dateFrom = null,
        ?string $dateTo = null
    ): Builder {
        $query = ScoreRecord::query()
            ->where('section_id', $sectionId)
            ->where('topic_id', $topicId)
            ->whereIn('student_id', $studentIds)
            ->whereHas('activity', function (Builder $builder): void {
                $builder->whereIn('instructional_phase', [
                    ActivityPhase::GAMIFIED->value,
                    ActivityPhase::FORMATIVE->value,
                ]);
            })
            ->with('student');

        if ($dateFrom) {
            $query->whereDate('attempted_at', '>=', Carbon::parse($dateFrom));
        }

        if ($dateTo) {
            $query->whereDate('attempted_at', '<=', Carbon::parse($dateTo));
        }

        return $query;
    }

    /**
     * @param  Collection<int, mixed>  $profiles
     * @param  Collection<int, ScoreRecord>  $records
     * @param  array<string, mixed>  $policy
     * @return Collection<int, array<string, mixed>>
     */
    protected function buildStudentMetrics(Collection $profiles, Collection $records, float $masteryThreshold, array $policy): Collection
    {
        return $profiles->map(function ($profile) use ($records, $masteryThreshold, $policy): array {
            $studentId = (int) $profile->user_id;
            $studentRecords = $records->where('student_id', $studentId)->values();
            $attempts = $studentRecords->count();
            $masteryPct = $this->weightedMasteryFromPolicy($studentRecords, $policy);
            $latestAttempt = $studentRecords->sortByDesc('attempted_at')->first();

            $interventionType = $masteryPct < $masteryThreshold ? 'remediation' : ($masteryPct >= 90 ? 'enrichment' : null);

            return [
                'student_id' => $studentId,
                'name' => $profile->user?->name ?? 'Unknown Student',
                'mastery_pct' => $masteryPct,
                'attempts' => $attempts,
                'phase_breakdown' => $this->phaseBreakdown($studentRecords),
                'latest_attempted_at' => $latestAttempt?->attempted_at,
                'intervention_type' => $interventionType,
            ];
        })->values();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $studentMetrics
     */
    protected function createInterventionsFromSnapshot(MasteryCycle $cycle, Collection $studentMetrics): void
    {
        foreach ($studentMetrics as $metric) {
            $type = $metric['intervention_type'];

            if (! in_array($type, ['remediation', 'enrichment'], true)) {
                continue;
            }

            $recommendedAction = $type === 'remediation'
                ? 'Reteach prerequisite concepts with guided practice and quick checks.'
                : 'Assign extension challenge and peer-support role for advanced transfer.';

            InterventionAssignment::query()->create([
                'mastery_cycle_id' => $cycle->id,
                'teacher_id' => $cycle->teacher_id,
                'section_id' => $cycle->section_id,
                'topic_id' => $cycle->topic_id,
                'student_id' => $metric['student_id'],
                'intervention_type' => $type,
                'recommended_action' => $recommendedAction,
                'reason' => "Current mastery: {$metric['mastery_pct']}%",
                'status' => 'assigned',
                'assigned_at' => now(),
                'due_at' => now()->addDays(7),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function weeklySummativeStats(
        int $sectionId,
        int $topicId,
        ?Carbon $weekStart = null,
        bool $required = true
    ): array {
        $start = ($weekStart ?? now()->startOfWeek())->copy()->startOfDay();
        $end = $start->copy()->endOfWeek();

        $records = ScoreRecord::query()
            ->where('section_id', $sectionId)
            ->where('topic_id', $topicId)
            ->whereBetween('attempted_at', [$start, $end])
            ->whereHas('activity', fn (Builder $builder): Builder => $builder->where('instructional_phase', ActivityPhase::SUMMATIVE->value))
            ->get();

        $distribution = [
            '90-100' => 0,
            '80-89' => 0,
            '75-79' => 0,
            '60-74' => 0,
            '0-59' => 0,
        ];

        foreach ($records as $record) {
            $accuracy = (float) $record->accuracy;
            if ($accuracy >= 90) {
                $distribution['90-100']++;
                continue;
            }
            if ($accuracy >= 80) {
                $distribution['80-89']++;
                continue;
            }
            if ($accuracy >= 75) {
                $distribution['75-79']++;
                continue;
            }
            if ($accuracy >= 60) {
                $distribution['60-74']++;
                continue;
            }
            $distribution['0-59']++;
        }

        return [
            'week_start' => $start->toDateString(),
            'week_end' => $end->toDateString(),
            'attempts' => $records->count(),
            'learners_assessed' => $records->pluck('student_id')->unique()->count(),
            'mps' => round((float) ($records->avg('accuracy') ?? 0), 2),
            'required' => $required,
            'compliant' => ! $required || $records->count() > 0,
            'distribution' => $distribution,
        ];
    }

    /**
     * @param  Collection<int, ScoreRecord>  $records
     * @param  array<string, mixed>  $policy
     */
    protected function weightedMasteryFromPolicy(Collection $records, array $policy): float
    {
        $phaseAverages = $this->phaseBreakdown($records);

        $weights = [
            ActivityPhase::GAMIFIED->value => (int) ($policy['gamified_weight'] ?? 20),
            ActivityPhase::FORMATIVE->value => (int) ($policy['formative_weight'] ?? 40),
            ActivityPhase::SUMMATIVE->value => (int) ($policy['summative_weight'] ?? 40),
        ];

        $weightedTotal = 0.0;
        $appliedWeight = 0;

        foreach ($phaseAverages as $phase => $average) {
            $weight = $weights[$phase] ?? 0;
            if ($weight <= 0) {
                continue;
            }

            $weightedTotal += $average * ($weight / 100);
            $appliedWeight += $weight;
        }

        if ($appliedWeight === 0) {
            return 0.0;
        }

        return round($weightedTotal / ($appliedWeight / 100), 2);
    }

    /**
     * @param  Collection<int, ScoreRecord>  $records
     * @return array<string, float>
     */
    protected function phaseBreakdown(Collection $records): array
    {
        $phaseScores = [
            ActivityPhase::GAMIFIED->value => [],
            ActivityPhase::FORMATIVE->value => [],
            ActivityPhase::SUMMATIVE->value => [],
        ];

        foreach ($records as $record) {
            $phase = $record->activity?->instructional_phase?->value ?? null;
            if (! in_array($phase, array_keys($phaseScores), true)) {
                continue;
            }

            $phaseScores[$phase][] = (float) $record->accuracy;
        }

        $result = [];
        foreach ($phaseScores as $phase => $scores) {
            if (count($scores) === 0) {
                continue;
            }

            $result[$phase] = round(array_sum($scores) / count($scores), 2);
        }

        return $result;
    }
}
