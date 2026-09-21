<?php

namespace Database\Factories;

use App\Models\Attempt;
use App\Models\AttemptAnswer;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AttemptAnswer>
 */
class AttemptAnswerFactory extends Factory
{
    protected $model = AttemptAnswer::class;

    public function definition(): array
    {
        return [
            'attempt_id' => Attempt::factory(),
            'question_id' => Question::factory(),
            'response_text' => fake()->word(),
            'is_correct' => fake()->boolean(70),
            'earned_points' => fake()->numberBetween(0, 10),
            'answered_at' => now()->subMinutes(fake()->numberBetween(1, 60)),
        ];
    }
}

