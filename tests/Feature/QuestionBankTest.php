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

    public function test_preloaded_game_banks_have_fifty_ft_and_one_hundred_summative_questions(): void
    {
        $assessments = app(\App\Services\GameQuestionBankService::class)->assessments();
        foreach ($assessments as $assessment) {
            $expected = $assessment['type'] === 'summative' ? 100 : 50;
            $this->assertCount($expected, $assessment['items']);
            $this->assertCount($expected, array_unique(array_column($assessment['items'], 'id')));
            $this->assertCount($expected, array_unique(array_column($assessment['items'], 'prompt')));
            foreach ($assessment['items'] as $item) {
                $this->assertContains($item['answer'], $item['choices']);
            }
        }
    }

    public function test_existing_game_questions_can_be_edited_and_loaded_by_students(): void
    {
        $teacher = User::factory()->teacher()->create();
        $this->actingAs($teacher)->get(route('teacher.question-bank.index'))
            ->assertOk()->assertSee('What kind of mixture looks the same throughout?');
        $data = [
            'prompt' => 'Updated mixture question',
            'choices' => ['Uniform', 'Non-uniform'],
            'answer' => 'Uniform',
            'feedback' => 'Uniform mixtures look the same throughout.',
        ];
        $this->actingAs($teacher)->patch(route('teacher.question-bank.game.update', ['q1-m1-l1', 'l1-1']), $data)
            ->assertSessionHasNoErrors()->assertRedirect(route('teacher.question-bank.index'));
        $this->assertSame('Uniform', app(\App\Services\GameQuestionBankService::class)->assessments()['q1-m1-l1']['items'][0]['answer']);
        $this->actingAs(User::factory()->student()->create())->get(route('student.dashboard'))
            ->assertOk()->assertSee('Updated mixture question');
        $this->patch(route('teacher.question-bank.game.update', ['q1-m1-l1', 'l1-1']), $data)->assertForbidden();
    }

    public function test_question_bank_page_lists_assessments_and_restricts_access_to_teachers(): void
    {
        $teacher = User::factory()->teacher()->create();
        $assessment = Activity::factory()->create(['instructional_phase' => ActivityPhase::FORMATIVE]);
        $game = Activity::factory()->create(['instructional_phase' => ActivityPhase::GAMIFIED]);

        $this->actingAs($teacher)->get(route('teacher.question-bank.index'))
            ->assertOk()
            ->assertSee('Question Bank')
            ->assertSee($assessment->title)
            ->assertDontSee($game->title);

        $this->actingAs(User::factory()->student()->create())
            ->get(route('teacher.question-bank.index'))->assertForbidden();
    }

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

    public function test_summative_activity_requires_one_hundred_questions(): void
    {
        $teacher = User::factory()->teacher()->create();
        $activity = Activity::factory()->create(['instructional_phase' => ActivityPhase::SUMMATIVE, 'is_active' => false]);
        $bank = QuestionBank::query()->create(['topic_id' => $activity->topic_id, 'phase' => 'summative']);
        Question::factory()->count(99)->create(['activity_id' => null, 'question_bank_id' => $bank->id]);
        $payload = [
            'topic_id' => $activity->topic_id,
            'title' => $activity->title,
            'activity_type' => $activity->activity_type->value,
            'instructional_phase' => 'summative',
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

    public function test_ft_and_summative_retries_draw_new_questions_from_the_fifty_question_bank(): void
    {
        foreach ([ActivityPhase::FORMATIVE, ActivityPhase::SUMMATIVE] as $phase) {
            $activity = Activity::factory()->create(['instructional_phase' => $phase, 'allow_retry' => true]);
            $bank = QuestionBank::query()->create(['topic_id' => $activity->topic_id, 'phase' => $phase->value, 'questions_per_attempt' => 10]);
            $pool = Question::factory()->count(50)->create(['activity_id' => null, 'question_bank_id' => $bank->id])->pluck('id')->all();
            $student = User::factory()->student()->create();

            $component = Livewire::actingAs($student)->test(ActivityPlayer::class, ['activity' => $activity]);
            $first = $component->get('selectedQuestionIds');
            $this->assertCount(10, $first);
            $this->assertEmpty(array_diff($first, $pool));

            $component->set('responses.'.$first[0], 'A')->call('retry');
            $second = $component->get('selectedQuestionIds');
            $this->assertCount(10, $second);
            $this->assertNotSame($first, $second);
            $this->assertEmpty(array_diff($second, $pool));
            $this->assertSame(array_fill_keys($second, ''), $component->get('responses'));
        }
    }
}
