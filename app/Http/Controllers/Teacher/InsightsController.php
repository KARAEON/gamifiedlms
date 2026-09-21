<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\ScoreRecord;
use App\Services\AnalyticsService;
use Illuminate\Support\Collection;
use Illuminate\View\View;

class InsightsController extends Controller
{
    public function __invoke(AnalyticsService $analyticsService): View
    {
        $analytics = $analyticsService->teacherAnalytics([
            'date_from' => now()->subDays(45)->toDateString(),
            'date_to' => now()->toDateString(),
        ]);

        $ranking = collect($analytics['topic_mastery_ranking']);
        $leastMastered = $ranking->sortByDesc('risk_index')->take(6)->values();
        $mostMastered = $ranking->sortByDesc('weighted_mastery')->take(6)->values();

        $studentsBelowThreshold = collect($analytics['students_needing_intervention']);

        $repeatedLowPerformance = ScoreRecord::query()
            ->with('student.studentProfile.section')
            ->where('accuracy', '<', 65)
            ->where('attempted_at', '>=', now()->subDays(30))
            ->get()
            ->groupBy('student_id')
            ->filter(fn (Collection $records): bool => $records->count() >= 4)
            ->map(function (Collection $records): array {
                $sample = $records->first();

                return [
                    'student' => $sample?->student?->name,
                    'section' => $sample?->student?->studentProfile?->section?->name,
                    'low_attempts' => $records->count(),
                    'average' => round((float) $records->avg('accuracy'), 2),
                ];
            })
            ->values();

        $recommendedFocusAreas = collect($analytics['recommendations'])->map(function (array $item): string {
            return "{$item['title']}: {$item['detail']}";
        });

        return view('teacher.insights.index', [
            'leastMastered' => $leastMastered,
            'mostMastered' => $mostMastered,
            'studentsBelowThreshold' => $studentsBelowThreshold,
            'repeatedLowPerformance' => $repeatedLowPerformance,
            'recommendedFocusAreas' => $recommendedFocusAreas,
            'weakTopicsBySection' => collect($analytics['weak_topics_by_section']),
            'strongTopicsBySection' => collect($analytics['strong_topics_by_section']),
            'trendSummary' => $analytics['trend_summary'],
            'sectionMasteryGap' => $analytics['section_mastery_gap'],
        ]);
    }
}
