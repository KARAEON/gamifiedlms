<?php

namespace Database\Factories;

use App\Models\Choice;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Choice>
 */
class ChoiceFactory extends Factory
{
    protected $model = Choice::class;

    public function definition(): array
    {
        return [
            'question_id' => Question::factory(),
            'label' => fake()->sentence(3),
            'value' => fake()->lexify('???'),
            'is_correct' => false,
            'sort_order' => fake()->numberBetween(1, 4),
        ];
    }
}

