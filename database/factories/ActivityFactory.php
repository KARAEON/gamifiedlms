<?php

namespace Database\Factories;

use App\Enums\ActivityPhase;
use App\Enums\ActivityType;
use App\Models\Activity;
use App\Models\Topic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Activity>
 */
class ActivityFactory extends Factory
{
    protected $model = Activity::class;

    public function definition(): array
    {
        return [
            'topic_id' => Topic::factory(),
            'title' => fake()->sentence(4),
            'activity_type' => fake()->randomElement(ActivityType::cases()),
            'instructional_phase' => fake()->randomElement(ActivityPhase::cases()),
            'instructions' => fake()->sentence(12),
            'settings' => [
                'passing_score' => 70,
                'show_correct_answers' => true,
            ],
            'max_score' => 100,
            'allow_retry' => true,
            'time_limit_seconds' => fake()->randomElement([120, 180, 240]),
            'is_active' => true,
            'sort_order' => fake()->numberBetween(1, 10),
        ];
    }
}
