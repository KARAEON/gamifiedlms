<?php

namespace Database\Factories;

use App\Models\Report;
use App\Models\ReportDelivery;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReportDelivery>
 */
class ReportDeliveryFactory extends Factory
{
    protected $model = ReportDelivery::class;

    public function definition(): array
    {
        return [
            'report_id' => Report::factory(),
            'submitted_by' => User::factory()->teacher(),
            'target_role' => 'admin',
            'status' => 'submitted',
            'acknowledged_by' => null,
            'submitted_at' => now()->subMinutes(fake()->numberBetween(5, 180)),
            'acknowledged_at' => null,
            'teacher_note' => fake()->sentence(8),
            'admin_note' => null,
        ];
    }
}
