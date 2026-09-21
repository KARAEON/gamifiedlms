<?php

namespace App\Services;

use App\Enums\ActivityPhase;
use App\Enums\ActivityType;
use App\Enums\UserRole;
use App\Models\PhaserGameResult;
use App\Models\ScoreRecord;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class TeacherScoreFeedService
{
    /**
     * @param  array<string, mixed>  $filters
     * @param  Collection<int, int|string>  $allowedSectionIds
     * @return array{records: LengthAwarePaginator, summary: array<string, float|int>}
     */
    public function build(array $filters, Collection $allowedSectionIds, int $page, int $perPage = 15): array
    {
        $rows = collect();

        if ($filters['source'] !== 'phaser' && $filters['result_type'] === '') {
            $rows = $rows->concat($this->activityRows($filters, $allowedSectionIds));
        }

        if ($filters['source'] !== 'activities') {
            $rows = $rows->concat($this->phaserRows($filters, $allowedSectionIds));
        }

        $rows = $rows
            ->sortByDesc(fn (array $row): int => $row['sort_timestamp'])
            ->values();

        $summary = [
            'total_attempts' => $rows->count(),
            'average_accuracy' => round((float) ($rows->avg('accuracy') ?? 0), 2),
            'average_score_percent' => round((float) $rows->avg(
                static fn (array $row): float => $row['max_score'] > 0
                    ? round(($row['score'] / $row['max_score']) * 100, 2)
                    : 0.0
            ), 2),
            'best_accuracy' => round((float) ($rows->max('accuracy') ?? 0), 2),
        ];

        $items = $rows->forPage($page, $perPage)->values();
        $records = new LengthAwarePaginator(
            $items,
            $rows->count(),
            $perPage,
            $page,
            [
                'path' => request()->url(),
                'query' => request()->query(),
            ],
        );

        return [
            'records' => $records,
            'summary' => $summary,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @param  Collection<int, int|string>  $allowedSectionIds
     * @return Collection<int, array<string, mixed>>
     */
    private function activityRows(array $filters, Collection $allowedSectionIds): Collection
    {
        $activityTypeLabels = ActivityType::labels();
        $phaseLabels = ActivityPhase::labels();

        $query = ScoreRecord::query()
            ->with([
                'student:id,name,email',
                'section:id,name',
                'lesson:id,title',
                'topic:id,title',
                'activity:id,title,activity_type,instructional_phase',
                'attempt:id,attempt_number',
            ])
            ->whereHas('student', fn ($builder) => $builder->where('role', UserRole::STUDENT));

        if ($allowedSectionIds->isNotEmpty()) {
            $query->where(function ($builder) use ($allowedSectionIds): void {
                $builder->whereIn('section_id', $allowedSectionIds)
                    ->orWhereHas('student.studentProfile', fn ($studentBuilder) => $studentBuilder->whereIn('section_id', $allowedSectionIds));
            });
        }

        if ($filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search): void {
                $builder->whereHas('student', fn ($studentBuilder) => $studentBuilder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"))
                    ->orWhereHas('activity', fn ($activityBuilder) => $activityBuilder->where('title', 'like', "%{$search}%"))
                    ->orWhereHas('topic', fn ($topicBuilder) => $topicBuilder->where('title', 'like', "%{$search}%"));
            });
        }

        if ($filters['section_id'] !== null && $filters['section_id'] !== '') {
            $query->where('section_id', (int) $filters['section_id']);
        }

        if ($filters['student_id'] !== null && $filters['student_id'] !== '') {
            $query->where('student_id', (int) $filters['student_id']);
        }

        if ($filters['activity_id'] !== null && $filters['activity_id'] !== '') {
            $query->where('activity_id', (int) $filters['activity_id']);
        }

        if ($filters['activity_type'] !== null && $filters['activity_type'] !== '') {
            $query->whereHas('activity', fn ($builder) => $builder->where('activity_type', (string) $filters['activity_type']));
        }

        if ($filters['instructional_phase'] !== null && $filters['instructional_phase'] !== '') {
            $query->whereHas('activity', fn ($builder) => $builder->where('instructional_phase', (string) $filters['instructional_phase']));
        }

        if ($filters['date_from'] !== null && $filters['date_from'] !== '') {
            $query->whereDate('attempted_at', '>=', (string) $filters['date_from']);
        }

        if ($filters['date_to'] !== null && $filters['date_to'] !== '') {
            $query->whereDate('attempted_at', '<=', (string) $filters['date_to']);
        }

        return $query->get()->map(function (ScoreRecord $record) use ($activityTypeLabels, $phaseLabels): array {
            $activityType = $record->activity?->activity_type;
            $activityTypeValue = is_object($activityType) ? $activityType->value : (string) $activityType;
            $phase = $record->activity?->instructional_phase;
            $phaseValue = is_object($phase) ? $phase->value : (string) $phase;
            $status = (string) $record->completion_status;

            return [
                'sort_timestamp' => optional($record->attempted_at)?->getTimestamp() ?? 0,
                'date' => optional($record->attempted_at)?->format('M d, Y h:i A') ?? '-',
                'student_id' => $record->student_id,
                'student_name' => $record->student?->name ?? 'Unknown Student',
                'student_email' => $record->student?->email ?? '',
                'section_name' => $record->section?->name ?? 'Unassigned',
                'game_title' => $record->activity?->title ?? 'N/A',
                'game_meta' => $activityTypeValue !== ''
                    ? ($activityTypeLabels[$activityTypeValue] ?? ucfirst(str_replace('_', ' ', $activityTypeValue)))
                    : 'Unknown type',
                'phase_label' => $phaseLabels[$phaseValue] ?? ucfirst(str_replace('_', ' ', $phaseValue ?: 'n/a')),
                'topic_title' => $record->topic?->title ?? 'N/A',
                'lesson_title' => $record->lesson?->title ?? '',
                'score' => (float) $record->score,
                'max_score' => (float) $record->max_score,
                'accuracy' => (float) $record->accuracy,
                'attempt_number' => $record->attempt?->attempt_number ?? '-',
                'status' => ucfirst($status),
                'status_tone' => $status === 'completed' ? 'success' : 'warning',
                'source' => 'activities',
                'result_type' => 'activity',
            ];
        });
    }

    /**
     * @param  array<string, mixed>  $filters
     * @param  Collection<int, int|string>  $allowedSectionIds
     * @return Collection<int, array<string, mixed>>
     */
    private function phaserRows(array $filters, Collection $allowedSectionIds): Collection
    {
        $phaseLabels = ActivityPhase::labels();

        $query = PhaserGameResult::query()
            ->with([
                'student:id,name,email',
                'section:id,name',
            ])
            ->whereHas('student', fn ($builder) => $builder->where('role', UserRole::STUDENT));

        if ($allowedSectionIds->isNotEmpty()) {
            $query->where(function ($builder) use ($allowedSectionIds): void {
                $builder->whereIn('section_id', $allowedSectionIds)
                    ->orWhereHas('student.studentProfile', fn ($studentBuilder) => $studentBuilder->whereIn('section_id', $allowedSectionIds));
            });
        }

        if ($filters['search'] !== '') {
            $search = $filters['search'];
            $query->where(function ($builder) use ($search): void {
                $builder->whereHas('student', fn ($studentBuilder) => $studentBuilder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"))
                    ->orWhere('game_title', 'like', "%{$search}%")
                    ->orWhere('topic_title', 'like', "%{$search}%")
                    ->orWhere('lesson_title', 'like', "%{$search}%");
            });
        }

        if ($filters['section_id'] !== null && $filters['section_id'] !== '') {
            $query->where('section_id', (int) $filters['section_id']);
        }

        if ($filters['student_id'] !== null && $filters['student_id'] !== '') {
            $query->where('student_id', (int) $filters['student_id']);
        }

        if ($filters['instructional_phase'] !== null && $filters['instructional_phase'] !== '') {
            $query->where('phase', (string) $filters['instructional_phase']);
        }

        if ($filters['result_type'] !== null && $filters['result_type'] !== '') {
            $query->where('entry_type', (string) $filters['result_type']);
        }

        if ($filters['date_from'] !== null && $filters['date_from'] !== '') {
            $query->whereDate('completed_at', '>=', (string) $filters['date_from']);
        }

        if ($filters['date_to'] !== null && $filters['date_to'] !== '') {
            $query->whereDate('completed_at', '<=', (string) $filters['date_to']);
        }

        return $query->get()->map(function (PhaserGameResult $result) use ($phaseLabels): array {
            $status = (string) $result->result_status;
            $statusTone = match ($status) {
                'win', 'pass' => 'success',
                'lose', 'fail' => 'warning',
                default => 'neutral',
            };

            return [
                'sort_timestamp' => optional($result->completed_at)?->getTimestamp() ?? 0,
                'date' => optional($result->completed_at)?->format('M d, Y h:i A') ?? '-',
                'student_id' => $result->student_id,
                'student_name' => $result->student?->name ?? 'Unknown Student',
                'student_email' => $result->student?->email ?? '',
                'section_name' => $result->section?->name ?? 'Unassigned',
                'game_title' => $result->game_title,
                'game_meta' => $result->entry_type === 'assessment' ? 'Phaser Assessment' : 'Phaser Minigame',
                'phase_label' => $phaseLabels[$result->phase] ?? ucfirst(str_replace('_', ' ', $result->phase)),
                'topic_title' => $result->topic_title,
                'lesson_title' => $result->lesson_title,
                'score' => (float) $result->score,
                'max_score' => (float) $result->max_score,
                'accuracy' => (float) $result->accuracy,
                'attempt_number' => $result->attempt_number,
                'status' => ucfirst($status),
                'status_tone' => $statusTone,
                'source' => 'phaser',
                'result_type' => $result->entry_type,
            ];
        });
    }
}
