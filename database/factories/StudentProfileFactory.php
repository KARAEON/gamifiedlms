<?php

namespace Database\Factories;

use App\Models\Section;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StudentProfile>
 */
class StudentProfileFactory extends Factory
{
    protected $model = StudentProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->student(),
            'section_id' => Section::factory(),
            'learner_reference' => 'LRN-'.fake()->unique()->numberBetween(100000, 999999),
            'birth_date' => fake()->dateTimeBetween('-13 years', '-10 years'),
            'guardian_name' => fake()->name(),
            'learning_goal' => fake()->sentence(10),
        ];
    }
}

