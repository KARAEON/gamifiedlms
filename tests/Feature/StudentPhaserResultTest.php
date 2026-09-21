<?php

namespace Tests\Feature;

use App\Models\PhaserGameResult;
use App\Models\Section;
use App\Models\SectionPhaserMajorLock;
use App\Models\SectionPhaserLessonLock;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentPhaserResultTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_store_a_phaser_minigame_result(): void
    {
        [$student, $section] = $this->buildStudent();

        $response = $this->actingAs($student)->postJson(route('student.phaser-results.store'), [
            'submission_uuid' => 'c7b8c0a7-32ef-4ce7-9004-f5a0d1cf1f81',
            'entry_type' => 'minigame',
            'lesson_key' => 'q1-m1-l1',
            'game_key' => 'mix-match-memory-quest',
            'payload' => [
                'matched_set_count' => 4,
                'fast_match_count' => 2,
                'finished_all' => true,
                'time_remaining_seconds' => 18.4,
            ],
        ]);

        $response->assertCreated()
            ->assertJson([
                'stored' => true,
                'created' => true,
                'result_status' => 'win',
                'attempt_number' => 1,
            ]);

        $this->assertDatabaseHas('phaser_game_results', [
            'student_id' => $student->id,
            'section_id' => $section->id,
            'lesson_key' => 'q1-m1-l1',
            'game_key' => 'mix-match-memory-quest',
            'entry_type' => 'minigame',
            'phase' => 'gamified',
            'game_title' => 'MIX MATCH MEMORY QUEST',
            'result_status' => 'win',
        ]);
    }

    public function test_duplicate_submission_uuid_returns_the_existing_result(): void
    {
        [$student] = $this->buildStudent();

        $payload = [
            'submission_uuid' => '66f65d11-e4d7-4411-bb39-51ef9d2fa413',
            'entry_type' => 'assessment',
            'lesson_key' => 'q1-m1-l1',
            'game_key' => 'ft-q1-mixtures-l1',
            'payload' => [
                'answers' => [
                    'l1-1' => 'Uniform Mixture',
                    'l1-2' => 'Uniform Mixture',
                    'l1-3' => 'Its parts are visible',
                    'l1-4' => 'Components can be seen separately',
                    'l1-5' => 'Uniform - Salt Water - Same throughout',
                ],
            ],
        ];

        $this->actingAs($student)->postJson(route('student.phaser-results.store'), $payload)->assertCreated();
        $secondResponse = $this->actingAs($student)->postJson(route('student.phaser-results.store'), $payload);

        $secondResponse->assertOk()
            ->assertJson([
                'stored' => true,
                'created' => false,
                'result_status' => 'pass',
                'attempt_number' => 1,
            ]);

        $this->assertSame(1, PhaserGameResult::query()->count());
    }

    public function test_locked_lesson_rejects_a_new_phaser_submission(): void
    {
        [$student, $section] = $this->buildStudent();

        SectionPhaserLessonLock::query()->create([
            'section_id' => $section->id,
            'lesson_key' => 'q1-m1-l2',
            'locked_by' => null,
        ]);

        $response = $this->actingAs($student)->postJson(route('student.phaser-results.store'), [
            'submission_uuid' => '7818d965-584e-4d22-89d2-00ea2969bdb1',
            'entry_type' => 'minigame',
            'lesson_key' => 'q1-m1-l2',
            'game_key' => 'supply-cart-sorting',
            'payload' => [
                'correct_sort_count' => 6,
                'sort_attempt_count' => 6,
                'correct_use_count' => 6,
                'completed_item_count' => 6,
                'best_combo' => 4,
                'time_remaining_seconds' => 21.5,
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['lesson_key']);

        $this->assertDatabaseCount('phaser_game_results', 0);
    }

    public function test_locked_parent_major_rejects_a_new_phaser_submission(): void
    {
        [$student, $section] = $this->buildStudent();

        SectionPhaserMajorLock::query()->create([
            'section_id' => $section->id,
            'major_key' => 'q1-major-1',
            'locked_by' => null,
        ]);

        $response = $this->actingAs($student)->postJson(route('student.phaser-results.store'), [
            'submission_uuid' => '6529e0d2-2709-44ac-9fdd-3250a8f31fd6',
            'entry_type' => 'minigame',
            'lesson_key' => 'q1-m1-l1',
            'game_key' => 'mix-match-memory-quest',
            'payload' => [
                'matched_set_count' => 4,
                'fast_match_count' => 2,
                'finished_all' => true,
                'time_remaining_seconds' => 18.4,
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['lesson_key']);

        $this->assertDatabaseCount('phaser_game_results', 0);
    }

    /**
     * @return array{0: User, 1: Section}
     */
    private function buildStudent(): array
    {
        $student = User::factory()->student()->create();
        $section = Section::factory()->create();

        StudentProfile::factory()->create([
            'user_id' => $student->id,
            'section_id' => $section->id,
        ]);

        return [$student, $section];
    }
}
