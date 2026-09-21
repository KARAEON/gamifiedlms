<?php

namespace Database\Factories;

use App\Models\Lesson;
use App\Models\Topic;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Topic>
 */
class TopicFactory extends Factory
{
    protected $model = Topic::class;

    public function definition(): array
    {
        $title = fake()->unique()->words(2, true);

        return [
            'lesson_id' => Lesson::factory(),
            'title' => Str::title($title),
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1, 999),
            'summary' => fake()->sentence(12),
            'difficulty_level' => fake()->numberBetween(1, 3),
            'is_active' => true,
        ];
    }
}

