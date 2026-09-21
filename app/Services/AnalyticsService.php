<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Attempt;
use App\Models\ScoreRecord;
use App\Models\Section;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * @return array<string, mixed>
     */
    public function studentDashboard(User $student): array
    {
        $recordsQuery = ScoreRecord::query()
            ->where('student_id', $student->id)
            ->with(['topic.lesson', 'activity'])
            ->orderByDesc('attempted_at');

        $overallAverage = round((float) (clone $recordsQuery)->avg('accuracy'), 2);
        $completedActivities = (int) (clone $recordsQuery)->distinct('activity_id')->count('activity_id');
        $recentResults = (clone $recordsQuery)->take(6)->get();

        $topicPerformance = (clone $recordsQuery)
            ->select(
                'topic_id',
                DB::raw('AVG(accuracy) as avg_accuracy'),
                DB::raw('COUNT(*) as total_attempts')
            )
            ->groupBy('topic_id')
            ->with('topic.lesson')
            ->get();

        $strongestTopics = $topicPerformance->sortByDesc('avg_accuracy')->take(3)->values();
        $weakestTopics = $topicPerformance->sortBy('avg_accuracy')->take(3)->values();

        $progressTrend = (clone $recordsQuery)
            ->where('attempted_at', '>=', now()->subDays(30))
            ->selectRaw('DATE(attempted_at) as date, AVG(accuracy) as avg_accuracy')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $attemptedActivityIds = (clone $recordsQuery)->pluck('activity_id')->unique();

        $pendingActivities = Activity::query()
            ->where('is_active', true)
            ->whereNotIn('id', $attemptedActivityIds)
            ->with('topic.lesson')
            ->orderBy('sort_order')
            ->take(6)
            ->get();

        return [
            'overall_average' => $overallAverage,
            'completed_activities' => $completedActivities,
            'recent_results' => $recentResults,
            'strongest_topics' => $strongestTopics,
            'weakest_topics' => $weakestTopics,
            'progress_trend' => $progressTrend,
            'pending_activities' => $pendingActivities,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function teacherAnalytics(array $filters = []): array
    {
        $recordsQuery = $this->filteredScoreRecords($filters);
        $records = $recordsQuery->with(['student.studentProfile.section', 'section', 'topic.lesson', 'activity'])->get();

        $studentsCount = User::query()->where('role', 'student')->where('is_active', true)->count();
        $sectionsCount = Section::query()->count();
        $avgClassPerformance = round((float) ($records->avg('accuracy') ?? 0), 2);

        [$currentStart, $currentEnd] = $this->resolveDateWindow($filters);
        $windowDays = max(1, $currentStart->diffInDays($currentEnd) + 1);
        $previousStart = (clone $currentStart)->subDays($windowDays);
        $previousEnd = (clone $currentStart)->subDay();

        $previousQuery = $this->filteredScoreRecords(array_merge($filters, [
            'date_from' => $previousStart->toDateString(),
            'date_to' => $previousEnd->toDateString(),
        ]));
        $previousAvg = round((float) (clone $previousQuery)->avg('accuracy'), 2);
        $previousCount = (clone $previousQuery)->count();

        $attemptsQuery = Attempt::query();
        $this->applyAttemptFilters($attemptsQuery, $filters);

        $mostActiveStudents = (clone $attemptsQuery)
            ->select('student_id', DB::raw('COUNT(*) as total_attempts'))
            ->groupBy('student_id')
            ->orderByDesc('total_attempts')
            ->take(8)
            ->with('student.studentProfile.section')
            ->get();

        $studentsNeedingIntervention = $records
            ->groupBy('student_id')
            ->map(function (Collection $studentRecords, int|string $studentId): array {
                /** @var ScoreRecord|null $latest */
                $latest = $studentRecords->sortByDesc('attempted_at')->first();
                $avgAccuracy = round((float) $studentRecords->avg('accuracy'), 2);
                $lowScoreRate = round(($studentRecords->where('accuracy', '<', 70)->count() / max(1, $studentRecords->count())) * 100, 2);

                $recent = $studentRecords->sortByDesc('attempted_at')->take(3)->avg('accuracy');
                $older = $studentRecords->sortByDesc('attempted_at')->slice(3, 3)->avg('accuracy');
                $trendDelta = round((float) $recent - (float) $older, 2);

                return [
                    'student_id' => (int) $studentId,
                    'name' => $latest?->student?->name ?? 'Unknown',
                    'section' => $latest?->student?->studentProfile?->section?->name,
                    'average_accuracy' => $avgAccuracy,
                    'attempts' => $studentRecords->count(),
                    'low_score_rate' => $lowScoreRate,
                    'recent_delta' => $trendDelta,
                ];
            })
            ->filter(function (array $student): bool {
                return ($student['average_accuracy'] < 70 || $student['low_score_rate'] >= 55)
                    && $student['attempts'] >= 3;
            })
            ->sortBy(fn (array $student): float => $student['average_accuracy'] + ($student['recent_delta'] < 0 ? -5 : 0))
            ->take(10)
            ->values();

        $topicInsights = $this->buildTopicInsights($records);
        $strongestTopics = $topicInsights
            ->where('attempts', '>=', 3)
            ->sortByDesc('weighted_mastery')
            ->take(6)
            ->values();
        $weakestTopics = $topicInsights
            ->where('attempts', '>=', 3)
            ->sortByDesc('risk_index')
            ->take(6)
            ->values();

        $completionRateByLesson = $records
            ->groupBy('lesson_id')
            ->map(function (Collection $lessonRecords): array {
                /** @var ScoreRecord|null $seed */
                $seed = $lessonRecords->first();
                $completed = $lessonRecords->where('completion_status', 'completed')->count();
                $total = $lessonRecords->count();
                $completionRate = $total > 0 ? round(($completed / $total) * 100, 2) : 0.0;
                $avgAccuracy = round((float) $lessonRecords->avg('accuracy'), 2);

                return [
                    'lesson' => $seed?->lesson?->title ?? 'Unknown Lesson',
                    'completion_rate' => $completionRate,
                    'avg_accuracy' => $avgAccuracy,
                    'mastery_index' => round(($avgAccuracy * 0.75) + ($completionRate * 0.25), 2),
                    'attempts' => $total,
                ];
            })
            ->sortByDesc('mastery_index')
            ->values();

        $scoreTrend = $records
            ->groupBy(fn (ScoreRecord $record): string => optional($record->attempted_at)->format('Y-m-d') ?? '')
            ->map(fn (Collection $dailyRecords): float => round((float) $dailyRecords->avg('accuracy'), 2))
            ->sortKeys()
            ->map(fn (float $value, string $date): array => ['date' => $date, 'value' => $value])
            ->values();

        $movingAverageTrend = $this->buildMovingAverage($scoreTrend, 3);
        $sectionComparison = $this->buildSectionComparison($records);
        $sectionMasteryAverage = round((float) ($sectionComparison->avg('mastery_index') ?? 0), 2);
        $sectionComparison = $sectionComparison
            ->values()
            ->map(function (array $section, int $index) use ($sectionMasteryAverage): array {
                $section['rank'] = $index + 1;
                $section['vs_class_delta'] = round((float) $section['mastery_index'] - $sectionMasteryAverage, 2);

                return $section;
            });

        $sectionTopicSignals = $this->buildSectionTopicSignals($records);
        $strongTopicsBySection = $sectionTopicSignals->map(fn (array $item): array => [
            'section' => $item['section'],
            'topics' => $item['strong_topics'],
        ])->values();
        $weakTopicsBySection = $sectionTopicSignals->map(fn (array $item): array => [
            'section' => $item['section'],
            'topics' => $item['weak_topics'],
        ])->values();

        $distributionBuckets = [
            '90-100' => 0,
            '80-89' => 0,
            '70-79' => 0,
            '60-69' => 0,
            '0-59' => 0,
        ];

        foreach ($records as $record) {
            $accuracy = (float) $record->accuracy;

            if ($accuracy >= 90) {
                $distributionBuckets['90-100']++;
                continue;
            }
            if ($accuracy >= 80) {
                $distributionBuckets['80-89']++;
                continue;
            }
            if ($accuracy >= 70) {
                $distributionBuckets['70-79']++;
                continue;
            }
            if ($accuracy >= 60) {
                $distributionBuckets['60-69']++;
                continue;
            }
            $distributionBuckets['0-59']++;
        }

        $completionFunnel = [
            'completed' => $records->where('completion_status', 'completed')->count(),
            'not_completed' => $records->where('completion_status', '!=', 'completed')->count(),
        ];

        $trendDelta = $previousCount > 0 ? round($avgClassPerformance - $previousAvg, 2) : 0.0;
        $sectionMasteryGap = round(
            (float) ($sectionComparison->max('mastery_index') ?? 0) - (float) ($sectionComparison->min('mastery_index') ?? 0),
            2
        );

        $recommendations = $this->buildRecommendations(
            $weakestTopics,
            $sectionComparison,
            $studentsNeedingIntervention,
            $sectionMasteryGap
        );

        return [
            'students_count' => $studentsCount,
            'sections_count' => $sectionsCount,
            'avg_class_performance' => $avgClassPerformance,
            'most_active_students' => $mostActiveStudents,
            'students_needing_intervention' => $studentsNeedingIntervention,
            'strongest_topics' => $strongestTopics,
            'weakest_topics' => $weakestTopics,
            'strong_topics_by_section' => $strongTopicsBySection,
            'weak_topics_by_section' => $weakTopicsBySection,
            'completion_rate_by_lesson' => $completionRateByLesson,
            'completion_funnel' => $completionFunnel,
            'total_attempts' => $records->count(),
            'average_score' => round((float) $records->avg('score'), 2),
            'accuracy_rate' => $avgClassPerformance,
            'topic_mastery_ranking' => $topicInsights,
            'score_trend' => $scoreTrend,
            'score_trend_moving_avg' => $movingAverageTrend,
            'section_comparison' => $sectionComparison,
            'score_distribution' => $distributionBuckets,
            'mastery_heatmap' => $this->buildMasteryHeatmap($records),
            'trend_summary' => [
                'current_average' => $avgClassPerformance,
                'previous_average' => $previousAvg,
                'delta' => $trendDelta,
                'direction' => $trendDelta > 0 ? 'up' : ($trendDelta < 0 ? 'down' : 'flat'),
                'window_days' => $windowDays,
                'has_previous' => $previousCount > 0,
            ],
            'section_mastery_gap' => $sectionMasteryGap,
            'section_mastery_average' => $sectionMasteryAverage,
            'recommendations' => $recommendations,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    protected function filteredScoreRecords(array $filters): Builder
    {
        $query = ScoreRecord::query();

        if (! empty($filters['date_from'])) {
            $query->whereDate('attempted_at', '>=', Carbon::parse((string) $filters['date_from']));
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('attempted_at', '<=', Carbon::parse((string) $filters['date_to']));
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
     * @return Collection<int, array<string, mixed>>
     */
    public function strongestWeakestTopicsForStudent(User $student): Collection
    {
        return ScoreRecord::query()
            ->where('student_id', $student->id)
            ->select('topic_id', DB::raw('AVG(accuracy) as avg_accuracy'), DB::raw('COUNT(*) as attempts'))
            ->with('topic.lesson')
            ->groupBy('topic_id')
            ->get()
            ->sortByDesc('avg_accuracy')
            ->values()
            ->map(function (ScoreRecord $record): array {
                return [
                    'topic' => $record->topic?->title,
                    'lesson' => $record->topic?->lesson?->title,
                    'accuracy' => round((float) $record->avg_accuracy, 2),
                    'attempts' => (int) $record->attempts,
                ];
            });
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{0: Carbon, 1: Carbon}
     */
    protected function resolveDateWindow(array $filters): array
    {
        $dateTo = ! empty($filters['date_to']) ? Carbon::parse((string) $filters['date_to']) : now();
        $dateFrom = ! empty($filters['date_from']) ? Carbon::parse((string) $filters['date_from']) : (clone $dateTo)->subDays(30);

        if ($dateFrom->greaterThan($dateTo)) {
            [$dateFrom, $dateTo] = [$dateTo, $dateFrom];
        }

        return [$dateFrom->startOfDay(), $dateTo->endOfDay()];
    }

    /**
     * @param  Builder<Attempt>  $query
     * @param  array<string, mixed>  $filters
     */
    protected function applyAttemptFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['date_from'])) {
            $query->whereDate('completed_at', '>=', Carbon::parse((string) $filters['date_from']));
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('completed_at', '<=', Carbon::parse((string) $filters['date_to']));
        }
        if (! empty($filters['student_id'])) {
            $query->where('student_id', (int) $filters['student_id']);
        }
        if (! empty($filters['section_id'])) {
            $query->where('section_id', (int) $filters['section_id']);
        }
        if (! empty($filters['topic_id'])) {
            $topicId = (int) $filters['topic_id'];
            $query->whereHas('activity', fn (Builder $builder): Builder => $builder->where('topic_id', $topicId));
        }
        if (! empty($filters['lesson_id'])) {
            $lessonId = (int) $filters['lesson_id'];
            $query->whereHas('activity.topic', fn (Builder $builder): Builder => $builder->where('lesson_id', $lessonId));
        }
        if (! empty($filters['activity_type'])) {
            $activityType = (string) $filters['activity_type'];
            $query->whereHas('activity', fn (Builder $builder): Builder => $builder->where('activity_type', $activityType));
        }
    }

    /**
     * @param  Collection<int, ScoreRecord>  $records
     * @return Collection<int, array<string, mixed>>
     */
    protected function buildTopicInsights(Collection $records): Collection
    {
        return $records
            ->groupBy('topic_id')
            ->map(function (Collection $topicRecords): array {
                /** @var ScoreRecord|null $seed */
                $seed = $topicRecords->first();
                $attempts = max(1, $topicRecords->count());
                $avgAccuracy = round((float) $topicRecords->avg('accuracy'), 2);
                $completionRate = round(($topicRecords->where('completion_status', 'completed')->count() / $attempts) * 100, 2);
                $lowScoreRate = round(($topicRecords->where('accuracy', '<', 70)->count() / $attempts) * 100, 2);

                $confidence = min(1, $attempts / 8);
                $baseMastery = ($avgAccuracy * 0.72) + ($completionRate * 0.18) + ((100 - $lowScoreRate) * 0.1);
                $weightedMastery = round(($baseMastery * $confidence) + ($avgAccuracy * (1 - $confidence)), 2);

                $riskIndex = round(
                    ((100 - $avgAccuracy) * 0.62)
                        + ((100 - $completionRate) * 0.18)
                        + ($lowScoreRate * 0.2)
                        + (max(0, 4 - $attempts) * 1.5),
                    2
                );

                return [
                    'topic_id' => $seed?->topic_id,
                    'topic' => $seed?->topic?->title ?? 'Unknown Topic',
                    'lesson' => $seed?->topic?->lesson?->title ?? 'Unknown Lesson',
                    'avg_accuracy' => $avgAccuracy,
                    'attempts' => $attempts,
                    'completion_rate' => $completionRate,
                    'low_score_rate' => $lowScoreRate,
                    'weighted_mastery' => $weightedMastery,
                    'risk_index' => $riskIndex,
                    'mastery_band' => $weightedMastery >= 85 ? 'advanced' : ($weightedMastery >= 70 ? 'proficient' : 'developing'),
                    'risk_band' => $riskIndex >= 40 ? 'high' : ($riskIndex >= 25 ? 'moderate' : 'low'),
                ];
            })
            ->values();
    }

    /**
     * @param  Collection<int, ScoreRecord>  $records
     * @return Collection<int, array<string, mixed>>
     */
    protected function buildSectionComparison(Collection $records): Collection
    {
        return $records
            ->groupBy('section_id')
            ->map(function (Collection $sectionRecords): array {
                /** @var ScoreRecord|null $seed */
                $seed = $sectionRecords->first();
                $attempts = max(1, $sectionRecords->count());
                $avgAccuracy = round((float) $sectionRecords->avg('accuracy'), 2);
                $completionRate = round(($sectionRecords->where('completion_status', 'completed')->count() / $attempts) * 100, 2);
                $studentsCount = $sectionRecords->pluck('student_id')->unique()->count();

                $studentAverages = $sectionRecords
                    ->groupBy('student_id')
                    ->map(fn (Collection $studentRecords): float => (float) $studentRecords->avg('accuracy'));
                $belowThreshold = $studentAverages->filter(fn (float $avg): bool => $avg < 70)->count();

                $stability = $this->stabilityScore($sectionRecords->pluck('accuracy')->map(fn ($value): float => (float) $value));
                $masteryIndex = round(($avgAccuracy * 0.68) + ($completionRate * 0.22) + ($stability * 0.1), 2);

                return [
                    'section_id' => $seed?->section_id,
                    'section' => $seed?->section?->name ?? 'Unassigned',
                    'avg_accuracy' => $avgAccuracy,
                    'completion_rate' => $completionRate,
                    'total_attempts' => $attempts,
                    'students_count' => $studentsCount,
                    'below_threshold_students' => $belowThreshold,
                    'stability' => $stability,
                    'mastery_index' => $masteryIndex,
                ];
            })
            ->sortByDesc('mastery_index')
            ->values();
    }

    /**
     * @param  Collection<int, ScoreRecord>  $records
     * @return Collection<int, array<string, mixed>>
     */
    protected function buildSectionTopicSignals(Collection $records): Collection
    {
        return $records
            ->groupBy('section_id')
            ->map(function (Collection $sectionRecords): array {
                /** @var ScoreRecord|null $seed */
                $seed = $sectionRecords->first();

                $topicSignals = $sectionRecords
                    ->groupBy('topic_id')
                    ->map(function (Collection $topicRecords): array {
                        /** @var ScoreRecord|null $sample */
                        $sample = $topicRecords->first();
                        $attempts = max(1, $topicRecords->count());
                        $avgAccuracy = round((float) $topicRecords->avg('accuracy'), 2);
                        $completionRate = round(($topicRecords->where('completion_status', 'completed')->count() / $attempts) * 100, 2);
                        $lowScoreRate = round(($topicRecords->where('accuracy', '<', 70)->count() / $attempts) * 100, 2);

                        $masteryScore = round(($avgAccuracy * 0.7) + ($completionRate * 0.2) + ((100 - $lowScoreRate) * 0.1), 2);
                        $riskIndex = round(((100 - $avgAccuracy) * 0.6) + ((100 - $completionRate) * 0.2) + ($lowScoreRate * 0.2), 2);

                        return [
                            'topic' => $sample?->topic?->title ?? 'Unknown Topic',
                            'lesson' => $sample?->topic?->lesson?->title ?? 'Unknown Lesson',
                            'avg_accuracy' => $avgAccuracy,
                            'attempts' => $attempts,
                            'completion_rate' => $completionRate,
                            'low_score_rate' => $lowScoreRate,
                            'mastery_score' => $masteryScore,
                            'risk_index' => $riskIndex,
                        ];
                    })
                    ->filter(fn (array $topic): bool => $topic['attempts'] >= 2)
                    ->values();

                return [
                    'section' => $seed?->section?->name ?? 'Unassigned',
                    'strong_topics' => $topicSignals->sortByDesc('mastery_score')->take(3)->values()->all(),
                    'weak_topics' => $topicSignals->sortByDesc('risk_index')->take(3)->values()->all(),
                ];
            })
            ->values();
    }

    /**
     * @param  Collection<int, ScoreRecord>  $records
     * @return Collection<int, array<string, mixed>>
     */
    protected function buildMasteryHeatmap(Collection $records): Collection
    {
        return $records
            ->groupBy(fn (ScoreRecord $record): string => (string) $record->section_id.'|'.(string) $record->topic_id)
            ->map(function (Collection $items): array {
                /** @var ScoreRecord|null $sample */
                $sample = $items->first();

                return [
                    'section' => $sample?->section?->name ?? 'Unassigned',
                    'topic' => $sample?->topic?->title ?? 'Unknown Topic',
                    'avg_accuracy' => round((float) $items->avg('accuracy'), 2),
                    'attempts' => $items->count(),
                ];
            })
            ->sortByDesc('attempts')
            ->take(30)
            ->values();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $trend
     * @return Collection<int, array<string, mixed>>
     */
    protected function buildMovingAverage(Collection $trend, int $window = 3): Collection
    {
        $points = $trend->values();

        return $points->map(function (array $point, int $index) use ($points, $window): array {
            $slice = $points->slice(max(0, $index - ($window - 1)), $window);
            $movingAverage = round((float) $slice->avg('value'), 2);

            return [
                'date' => $point['date'],
                'value' => $movingAverage,
            ];
        });
    }

    /**
     * @param  Collection<int, float>  $values
     */
    protected function stabilityScore(Collection $values): float
    {
        if ($values->count() <= 1) {
            return 100.0;
        }

        $mean = (float) $values->avg();
        $variance = (float) $values->reduce(
            fn (float $carry, float $item): float => $carry + (($item - $mean) ** 2),
            0.0
        ) / $values->count();

        $stdDev = sqrt($variance);

        return round(max(0, 100 - $stdDev), 2);
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $weakestTopics
     * @param  Collection<int, array<string, mixed>>  $sectionComparison
     * @param  Collection<int, array<string, mixed>>  $studentsNeedingIntervention
     * @param  float  $sectionMasteryGap
     * @return Collection<int, array<string, mixed>>
     */
    protected function buildRecommendations(
        Collection $weakestTopics,
        Collection $sectionComparison,
        Collection $studentsNeedingIntervention,
        float $sectionMasteryGap
    ): Collection
    {
        $recommendations = collect();

        $topWeakTopic = $weakestTopics->first();
        if ($topWeakTopic) {
            $recommendations->push([
                'title' => 'Reinforce weakest topic cluster',
                'detail' => "{$topWeakTopic['topic']} in {$topWeakTopic['lesson']} has a risk index of {$topWeakTopic['risk_index']}.",
                'priority' => 'high',
            ]);
        }

        $lowestSection = $sectionComparison->sortBy('mastery_index')->first();
        if ($lowestSection) {
            $recommendations->push([
                'title' => 'Prioritize section support',
                'detail' => "{$lowestSection['section']} has the lowest mastery index and needs focused intervention.",
                'priority' => 'high',
            ]);
        }

        if ($sectionMasteryGap >= 12) {
            $recommendations->push([
                'title' => 'Address section performance gap',
                'detail' => "Mastery gap across sections is {$sectionMasteryGap} points. Plan differentiated interventions.",
                'priority' => 'medium',
            ]);
        }

        if ($studentsNeedingIntervention->count() > 0) {
            $recommendations->push([
                'title' => 'Schedule remediation clinics',
                'detail' => $studentsNeedingIntervention->count().' learners are currently flagged for intervention.',
                'priority' => 'medium',
            ]);
        }

        if ($recommendations->isEmpty()) {
            $recommendations->push([
                'title' => 'Maintain current instruction cadence',
                'detail' => 'No critical alerts detected. Continue enrichment and monitor trends weekly.',
                'priority' => 'low',
            ]);
        }

        return $recommendations;
    }
}
