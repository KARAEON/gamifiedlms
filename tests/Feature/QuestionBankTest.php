<?php

namespace Tests\Feature;

use App\Enums\ActivityPhase;
use App\Models\Activity;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\User;
use App\Services\ActivityScoringService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use App\Livewire\Student\ActivityPlayer;
use Tests\TestCase;

class QuestionBankTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_create_and_edit_a_question_with_choices_and_metadata(): void
    {
        $teacher = User::factory()->teacher()->create();
        $activity = Activity::factory()->create(['instructional_phase' => ActivityPhase::FORMATIVE]);

        $this->actingAs($teacher)->post(route('teacher.activities.questions.store', $activity), [
            'prompt' => 'Which material conducts electricity?',
            'question_type' => 'multiple_choice',
            'points' => 2,
            'media_path' => '/images/circuit.jpg',
            'payload_json' => '{"hint":"Think about metals."}',
            'choices' => [
                ['label' => 'Copper', 'value' => 'A', 'is_correct' => 1],
                ['label' => 'Rubber', 'value' => 'B'],
            ],
        ])->assertRedirect();

        $bank = QuestionBank::query()->where('topic_id', $activity->topic_id)->where('phase', 'formative')->firstOrFail();
        $question = $bank->questions()->firstOrFail();
        $this->assertSame('A', $question->correct_answer);
        $this->assertSame('/images/circuit.jpg', $question->media_path);
        $this->assertSame('Think about metals.', data_get($question->payload, 'hint'));
        $this->assertCount(2, $question->choices);

        $this->actingAs($teacher)->patch(route('teacher.questions.update', $question), [
            'prompt' => 'Updated prompt',
            'question_type' => 'guess_word',
            'correct_answer' => 'copper',
            'points' => 3,
            'sort_order' => 4,
            'payload_json' => '{"clue":"A reddish metal."}',
        ])->assertRedirect();

        $this->assertDatabaseHas('questions', ['id' => $question->id, 'prompt' => 'Updated prompt', 'sort_order' => 4]);
        $this->actingAs($teacher)->get(route('teacher.activities.index'))->assertOk()->assertSee('Updated prompt');
        $this->actingAs($teacher)->delete(route('teacher.questions.destroy', $question))->assertRedirect();
        $this->assertDatabaseMissing('questions', ['id' => $question->id]);
    }

    public function test_formative_activity_cannot_be_activated_until_bank_has_at_least_fifty_questions(): void
    {
        $teacher = User::factory()->teacher()->create();
        $activity = Activity::factory()->create(['instructional_phase' => ActivityPhase::FORMATIVE, 'is_active' => false]);
        $bank = QuestionBank::query()->create(['topic_id' => $activity->topic_id, 'phase' => 'formative']);
        Question::factory()->count(49)->create(['activity_id' => null, 'question_bank_id' => $bank->id]);

        $payload = [
            'topic_id' => $activity->topic_id,
            'title' => $activity->title,
            'activity_type' => $activity->activity_type->value,
            'instructional_phase' => 'formative',
            'instructions' => $activity->instructions,
            'max_score' => 100,
            'is_active' => 1,
        ];
        $this->actingAs($teacher)->patch(route('teacher.activities.update', $activity), $payload)
            ->assertSessionHasErrors('is_active');

        Question::factory()->create(['activity_id' => null, 'question_bank_id' => $bank->id]);
        $this->actingAs($teacher)->patch(route('teacher.activities.update', $activity), $payload)->assertRedirect();
        $this->assertDatabaseHas('activities', ['id' => $activity->id, 'is_active' => true]);
    }

    public function test_attempt_scores_only_the_fixed_selected_question_ids(): void
    {
        $activity = Activity::factory()->create(['instructional_phase' => ActivityPhase::FORMATIVE]);
        $bank = QuestionBank::query()->create(['topic_id' => $activity->topic_id, 'phase' => 'formative', 'questions_per_attempt' => 10]);
        $questions = Question::factory()->count(50)->create([
            'activity_id' => null,
            'question_bank_id' => $bank->id,
            'correct_answer' => 'A',
            'points' => 2,
        ]);
        $selected = $questions->take(10)->pluck('id')->map(fn ($id) => (int) $id)->all();
        $responses = array_fill_keys($selected, 'A');
        $student = User::factory()->student()->create();

        $attempt = app(ActivityScoringService::class)->evaluateAndStore($student, $activity, $responses, 30, $selected);

        $this->assertSame($selected, $attempt->question_ids);
        $this->assertCount(10, $attempt->answers);
        $this->assertSame(20.0, (float) $attempt->max_score);
        $this->assertSame(100.0, (float) $attempt->accuracy);
    }

    public function test_student_receives_configured_random_subset_and_retry_keeps_the_same_questions(): void
    {
        $activity = Activity::factory()->create(['instructional_phase' => ActivityPhase::FORMATIVE]);
        $bank = QuestionBank::query()->create(['topic_id' => $activity->topic_id, 'phase' => 'formative', 'questions_per_attempt' => 10]);
        Question::factory()->count(50)->create(['activity_id' => null, 'question_bank_id' => $bank->id]);
        $student = User::factory()->student()->create();

        $component = Livewire::actingAs($student)->test(ActivityPlayer::class, ['activity' => $activity]);
        $selected = $component->get('selectedQuestionIds');
        $this->assertCount(10, $selected);

        $component->call('retry')->assertSet('selectedQuestionIds', $selected);
    }
}
