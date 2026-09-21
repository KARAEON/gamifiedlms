<?php

namespace Database\Factories;

use App\Models\Lesson;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Lesson>
 */
class LessonFactory extends Factory
{
    protected $model = Lesson::class;

    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1, 999),
            'subject' => 'Science',
            'description' => fake()->paragraph(),
            'is_active' => true,
            'created_by' => User::factory()->teacher(),
            'published_at' => now()->subDays(fake()->numberBetween(1, 20)),
        ];
    }
}

