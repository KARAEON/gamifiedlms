<?php

namespace Database\Factories;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TeacherProfile>
 */
class TeacherProfileFactory extends Factory
{
    protected $model = TeacherProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->teacher(),
            'title' => fake()->randomElement(['Science Master Teacher', 'STEM Coordinator', 'Learning Coach']),
            'specialization' => fake()->randomElement(['Earth Science', 'Biology', 'Physics']),
            'bio' => fake()->paragraph(),
        ];
    }
}

