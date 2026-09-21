<?php

namespace Database\Factories;

use App\Models\Activity;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Question>
 */
class QuestionFactory extends Factory
{
    protected $model = Question::class;

    public function definition(): array
    {
        return [
            'activity_id' => Activity::factory(),
            'prompt' => fake()->sentence(12),
            'question_type' => 'multiple_choice',
            'payload' => null,
            'correct_answer' => 'A',
            'points' => fake()->numberBetween(5, 20),
            'sort_order' => fake()->numberBetween(1, 10),
        ];
    }
}

