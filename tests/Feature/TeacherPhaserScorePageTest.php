<?php

namespace Tests\Feature;

use App\Models\PhaserGameResult;
use App\Models\Section;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherPhaserScorePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_scores_page_shows_phaser_results(): void
    {
        $teacher = User::factory()->teacher()->create();
        $student = User::factory()->student()->create([
            'name' => 'Phaser Student',
            'email' => 'phaser.student@example.test',
        ]);
        $section = Section::factory()->create([
            'name' => 'Grade 6 - Actual',
        ]);

        $section->teachers()->attach($teacher->id);
        StudentProfile::factory()->create([
            'user_id' => $student->id,
            'section_id' => $section->id,
        ]);

        PhaserGameResult::query()->create([
            'student_id' => $student->id,
            'section_id' => $section->id,
            'lesson_key' => 'q1-m1-l1',
            'lesson_title' => 'Mixtures 1',
            'game_key' => 'mix-match-memory-quest',
            'entry_type' => 'minigame',
            'phase' => 'gamified',
            'game_title' => 'MIX MATCH MEMORY QUEST',
            'topic_title' => 'Q1 MATTER - MIXTURES',
            'submission_uuid' => 'b7fb6d3d-5a13-4d26-9f56-85a83fc86325',
            'attempt_number' => 1,
            'score' => 120,
            'max_score' => 150,
            'accuracy' => 100,
            'result_status' => 'win',
            'payload' => ['input' => [], 'derived' => []],
            'completed_at' => now(),
        ]);

        $this->actingAs($teacher)
            ->get(route('teacher.scores.index', ['source' => 'phaser']))
            ->assertOk()
            ->assertSee('MIX MATCH MEMORY QUEST')
            ->assertSee('Phaser Minigame')
            ->assertSee('Phaser Student')
            ->assertSee('Grade 6 - Actual')
            ->assertSee('Catbalogan I SPED Center')
            ->assertSee('School ID 193540')
            ->assertSee('Overview')
            ->assertSee('Learners')
            ->assertSee('Teaching')
            ->assertSee('Insights')
            ->assertSee('Account');
    }
}
