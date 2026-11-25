<?php

namespace Tests\Feature;

use App\Models\PhaserGameResult;
use App\Models\ScoreRecord;
use App\Models\Section;
use App\Models\User;
use App\Services\AnalyticsService;
use App\Services\AdminAnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class GameAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private function game(Section $section, User $student, int $accuracy, string $date, string $lesson = 'q1-m1-l1'): void
    {
        PhaserGameResult::query()->create([
            'student_id' => $student->id, 'section_id' => $section->id,
            'lesson_key' => $lesson, 'lesson_title' => 'Mixtures 1',
            'game_key' => 'ft-'.$lesson, 'entry_type' => 'assessment', 'phase' => 'formative',
            'game_title' => 'Formative test', 'topic_title' => 'Mixtures',
            'submission_uuid' => (string) Str::uuid(), 'attempt_number' => 1,
            'score' => $accuracy / 20, 'max_score' => 5, 'accuracy' => $accuracy,
            'result_status' => 'pass', 'payload' => [], 'completed_at' => $date,
        ]);
    }

    public function test_teacher_charts_combine_ft_and_regular_scores_and_respect_filters(): void
    {
        $teacher = User::factory()->teacher()->create();
        $section = Section::factory()->create();
        $section->teachers()->attach($teacher);
        $student = User::factory()->student()->create();
        $this->game($section, $student, 40, '2026-11-20');
        $this->game($section, $student, 80, '2026-11-21');
        $this->game(Section::factory()->create(), $student, 100, '2026-11-20');
        ScoreRecord::factory()->create(['section_id' => $section->id, 'student_id' => $student->id,
            'accuracy' => 60, 'attempted_at' => '2026-11-22']);
        $this->actingAs($teacher);
        $filters = ['date_from' => '2026-11-20', 'date_to' => '2026-11-22'];
        $analytics = app(AnalyticsService::class)->teacherAnalytics($filters);
        $this->assertSame(3, $analytics['total_attempts']);
        $this->assertSame(60.0, $analytics['avg_class_performance']);
        $this->assertSame(3, $analytics['most_active_students']->first()->total_attempts);
        $this->assertSame(40.0, $analytics['score_trend_moving_avg'][0]['value']);
        $gameTopic = $analytics['topic_mastery_ranking']->firstWhere('attempts', 2);
        $this->assertNotNull($gameTopic);
        $this->assertLessThan(0, $gameTopic['topic_id']);
        $filtered = app(AnalyticsService::class)->teacherAnalytics($filters + ['topic_id' => $gameTopic['topic_id']]);
        $this->assertSame(2, $filtered['total_attempts']);
        $this->assertSame(60.0, $filtered['accuracy_rate']);
        $this->get(route('teacher.analytics.index'))->assertOk();
    }

    public function test_admin_reports_include_game_ft_and_exclude_minigames(): void
    {
        $section = Section::factory()->create();
        $student = User::factory()->student()->create();
        $this->game($section, $student, 80, '2026-11-20');
        $this->game($section, $student, 100, '2026-11-20', 'q1-m1-l2');
        PhaserGameResult::query()->where('lesson_key', 'q1-m1-l2')->update(['entry_type' => 'minigame', 'phase' => 'gamified']);
        $service = app(AdminAnalyticsService::class);
        $filters = ['date_from' => '2026-11-20', 'date_to' => '2026-11-21'];
        $dashboard = $service->dashboard($filters);
        $this->assertSame(80.0, $dashboard['overview']['overall_mps']);
        $this->assertSame('Science', $dashboard['subject_performance']->first()['subject']);
        $this->assertSame(1, $dashboard['subject_performance']->first()['attempts']);
        $this->assertEmpty($service->dashboard($filters + ['subject' => 'English'])['subject_performance']);
        [, $rows] = $service->reportDataset('subject', $filters);
        $this->assertSame(['Science', 80.0, 1, 1], $rows->first());
    }

    public function test_student_progress_and_intervention_lists_include_game_ft(): void
    {
        $section = Section::factory()->create();
        $student = User::factory()->student()->create();
        foreach ([40, 60, 40] as $score) {
            $this->game($section, $student, $score, now()->toDateTimeString());
        }
        $service = app(AnalyticsService::class);
        $dashboard = $service->studentDashboard($student);
        $this->assertSame(46.67, $dashboard['overall_average']);
        $this->assertSame(1, $dashboard['completed_activities']);
        $this->assertCount(3, $dashboard['recent_results']);
        $this->assertCount(1, $dashboard['progress_trend']);
        $this->assertSame(3, $service->strongestWeakestTopicsForStudent($student)->first()['attempts']);
        $this->assertSame($student->id, $service->teacherAnalytics()['students_needing_intervention']->first()['student_id']);
    }

    public function test_previous_period_uses_game_ft_scores_with_matching_date_windows(): void
    {
        $section = Section::factory()->create();
        $student = User::factory()->student()->create();
        $this->game($section, $student, 40, '2026-11-18 12:00:00');
        $this->game($section, $student, 80, '2026-11-20 12:00:00');
        $summary = app(AnalyticsService::class)->teacherAnalytics([
            'date_from' => '2026-11-20', 'date_to' => '2026-11-21',
        ])['trend_summary'];
        $this->assertTrue($summary['has_previous']);
        $this->assertSame(40.0, $summary['previous_average']);
        $this->assertSame(40.0, $summary['delta']);
    }
}
