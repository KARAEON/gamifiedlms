<?php

namespace Database\Factories;

use App\Enums\AttemptStatus;
use App\Models\Activity;
use App\Models\Attempt;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Attempt>
 */
class AttemptFactory extends Factory
{
    protected $model = Attempt::class;

    public function definition(): array
    {
        $score = fake()->numberBetween(40, 100);

        return [
            'student_id' => User::factory()->student(),
            'section_id' => Section::factory(),
            'activity_id' => Activity::factory(),
            'status' => AttemptStatus::COMPLETED,
            'started_at' => now()->subMinutes(fake()->numberBetween(30, 240)),
            'completed_at' => now()->subMinutes(fake()->numberBetween(1, 29)),
            'attempt_number' => fake()->numberBetween(1, 3),
            'score' => $score,
            'max_score' => 100,
            'accuracy' => $score,
            'duration_seconds' => fake()->numberBetween(60, 600),
            'feedback_summary' => fake()->sentence(10),
        ];
    }
}

