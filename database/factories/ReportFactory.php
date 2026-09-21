<?php

namespace Database\Factories;

use App\Models\Report;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Report>
 */
class ReportFactory extends Factory
{
    protected $model = Report::class;

    public function definition(): array
    {
        return [
            'generated_by' => User::factory()->teacher(),
            'report_type' => fake()->randomElement(['student', 'section', 'summary']),
            'student_id' => null,
            'section_id' => Section::factory(),
            'title' => fake()->sentence(4),
            'filters' => [
                'date_from' => now()->subMonth()->toDateString(),
                'date_to' => now()->toDateString(),
            ],
            'remarks' => fake()->sentence(10),
            'generated_at' => now()->subDays(fake()->numberBetween(1, 15)),
        ];
    }
}

