<?php

namespace App\Services;

use App\Models\Report;
use App\Models\ScoreRecord;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ReportService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function buildStudentReport(User $student, array $filters = []): array
    {
        $records = $this->applyFilters(
            ScoreRecord::query()->where('student_id', $student->id)->with(['topic.lesson', 'activity']),
            $filters
        )->orderByDesc('attempted_at')->get();

        $topicSummary = $records
            ->groupBy('topic_id')
            ->map(function (Collection $group): array {
                $sample = $group->first();
                $attempts = max(1, $group->count());
                $avgAccuracy = round((float) $group->avg('accuracy'), 2);
                $lowScoreRate = round(($group->where('accuracy', '<', 70)->count() / $attempts) * 100, 2);
                $completionRate = round(($group->where('completion_status', 'completed')->count() / $attempts) * 100, 2);

                return [
                    'topic' => $sample?->topic?->title,
                    'lesson' => $sample?->topic?->lesson?->title,
                    'avg_accuracy' => $avgAccuracy,
                    'attempts' => $attempts,
                    'low_score_rate' => $lowScoreRate,
                    'completion_rate' => $completionRate,
                    'mastery_score' => round(($avgAccuracy * 0.78) + ($completionRate * 0.22), 2),
                ];
            })
            ->sortByDesc('mastery_score')
            ->values();

        $trend = $records
            ->groupBy(fn ($record): string => optional($record->attempted_at)->format('Y-m-d') ?? '')
            ->map(fn (Collection $group): float => round((float) $group->avg('accuracy'), 2))
            ->sortKeys()
            ->map(fn (float $value, string $date): array => ['date' => $date, 'value' => $value])
            ->values();

        $accuracyValues = $records->pluck('accuracy')->map(fn ($value): float => (float) $value);
        $consistencyScore = $records->isEmpty() ? 0.0 : $this->consistencyScore($accuracyValues);

        return [
            'records' => $records,
            'average' => round((float) $records->avg('accuracy'), 2),
            'completion_rate' => $records->isEmpty()
                ? 0
                : round((float) ($records->where('completion_status', 'completed')->count() / $records->count()) * 100, 2),
            'strongest_topics' => $topicSummary->take(3),
            'weakest_topics' => $topicSummary->sortBy('mastery_score')->take(3)->values(),
            'topic_summary' => $topicSummary,
            'trend' => $trend,
            'consistency_score' => $consistencyScore,
            'remarks' => $this->remarksFromPerformance(
                round((float) $records->avg('accuracy'), 2),
                round((float) ($records->where('completion_status', 'completed')->count() / max(1, $records->count())) * 100, 2)
            ),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function buildSectionReport(Section $section, array $filters = []): array
    {
        $records = $this->applyFilters(
            ScoreRecord::query()->where('section_id', $section->id)->with(['student', 'topic.lesson', 'activity']),
            $filters
        )->orderByDesc('attempted_at')->get();

        $studentSummaries = $records
            ->groupBy('student_id')
            ->map(function (Collection $group): array {
                $sample = $group->first();

                return [
                    'student' => $sample?->student?->name,
                    'average' => round((float) $group->avg('accuracy'), 2),
                    'attempts' => $group->count(),
                    'low_score_rate' => round(($group->where('accuracy', '<', 70)->count() / max(1, $group->count())) * 100, 2),
                ];
            })
            ->sortBy('average')
            ->values();

        $topicSummary = $records
            ->groupBy('topic_id')
            ->map(function (Collection $group): array {
                $sample = $group->first();
                $attempts = max(1, $group->count());
                $avgAccuracy = round((float) $group->avg('accuracy'), 2);
                $completionRate = round(($group->where('completion_status', 'completed')->count() / $attempts) * 100, 2);

                return [
                    'topic' => $sample?->topic?->title,
                    'lesson' => $sample?->topic?->lesson?->title,
                    'average_accuracy' => $avgAccuracy,
                    'attempts' => $attempts,
                    'completion_rate' => $completionRate,
                    'mastery_score' => round(($avgAccuracy * 0.75) + ($completionRate * 0.25), 2),
                ];
            })
            ->values();

        $avgAccuracy = round((float) $records->avg('accuracy'), 2);
        $completionRate = $records->isEmpty()
            ? 0
            : round((float) ($records->where('completion_status', 'completed')->count() / $records->count()) * 100, 2);

        return [
            'records' => $records,
            'average' => $avgAccuracy,
            'completion_rate' => $completionRate,
            'student_summaries' => $studentSummaries,
            'intervention_targets' => $studentSummaries->where('average', '<', 70)->values(),
            'strongest_topics' => $topicSummary->sortByDesc('mastery_score')->take(4)->values(),
            'weakest_topics' => $topicSummary->sortBy('mastery_score')->take(4)->values(),
            'topic_summary' => $topicSummary,
            'remarks' => $this->remarksFromPerformance($avgAccuracy, $completionRate),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return Collection<int, array<string, mixed>>
     */
    public function buildSummaryAnalytics(array $filters = []): Collection
    {
        $records = $this->applyFilters(
            ScoreRecord::query()->with(['topic.lesson', 'section']),
            $filters
        )->get();

        return $records
            ->groupBy(fn ($record): string => (string) $record->section_id.'|'.(string) $record->topic_id)
            ->map(function (Collection $group): array {
                $sample = $group->first();

                return [
                    'lesson' => $sample?->topic?->lesson?->title,
                    'topic' => $sample?->topic?->title,
                    'section' => $sample?->section?->name,
                    'average_accuracy' => round((float) $group->avg('accuracy'), 2),
                    'total_attempts' => $group->count(),
                    'completion_rate' => round(($group->where('completion_status', 'completed')->count() / max(1, $group->count())) * 100, 2),
                    'risk_index' => round(
                        ((100 - (float) $group->avg('accuracy')) * 0.7)
                        + ((100 - (($group->where('completion_status', 'completed')->count() / max(1, $group->count())) * 100)) * 0.3),
                        2
                    ),
                ];
            })
            ->sortByDesc('risk_index')
            ->values();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function logGeneratedReport(User $teacher, string $reportType, string $title, array $filters, ?int $studentId = null, ?int $sectionId = null): Report
    {
        return Report::query()->create([
            'generated_by' => $teacher->id,
            'report_type' => $reportType,
            'student_id' => $studentId,
            'section_id' => $sectionId,
            'title' => $title,
            'filters' => $filters,
            'generated_at' => now(),
            'remarks' => 'Generated from analytics module for intervention planning.',
        ]);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    protected function applyFilters(Builder $query, array $filters): Builder
    {
        if (! empty($filters['date_from'])) {
            $query->whereDate('attempted_at', '>=', (string) $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('attempted_at', '<=', (string) $filters['date_to']);
        }
        if (! empty($filters['student_id'])) {
            $query->where('student_id', (int) $filters['student_id']);
        }
        if (! empty($filters['section_id'])) {
            $query->where('section_id', (int) $filters['section_id']);
        }
        if (! empty($filters['lesson_id'])) {
            $query->where('lesson_id', (int) $filters['lesson_id']);
        }
        if (! empty($filters['topic_id'])) {
            $query->where('topic_id', (int) $filters['topic_id']);
        }
        if (! empty($filters['activity_type'])) {
            $query->whereHas('activity', function (Builder $builder) use ($filters): void {
                $builder->where('activity_type', (string) $filters['activity_type']);
            });
        }

        return $query;
    }

    /**
     * @param  Collection<int, float>  $values
     */
    protected function consistencyScore(Collection $values): float
    {
        if ($values->count() <= 1) {
            return 100.0;
        }

        $mean = (float) $values->avg();
        $variance = (float) $values->reduce(
            fn (float $carry, float $value): float => $carry + (($value - $mean) ** 2),
            0.0
        ) / $values->count();

        return round(max(0, 100 - sqrt($variance)), 2);
    }

    protected function remarksFromPerformance(float $average, float $completionRate): string
    {
        if ($average >= 85 && $completionRate >= 90) {
            return 'Strong mastery and consistent completion. Continue enrichment and higher-order challenges.';
        }

        if ($average >= 70 && $completionRate >= 75) {
            return 'Moderate mastery. Reinforce weak topics with targeted practice and review sessions.';
        }

        return 'Priority intervention needed. Use focused remediation and frequent progress monitoring.';
    }
}
