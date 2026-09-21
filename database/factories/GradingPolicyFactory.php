<?php

namespace Database\Factories;

use App\Models\GradingPolicy;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GradingPolicy>
 */
class GradingPolicyFactory extends Factory
{
    protected $model = GradingPolicy::class;

    public function definition(): array
    {
        return [
            'name' => 'Default Enterprise Policy',
            'scope' => 'global',
            'section_id' => null,
            'subject' => null,
            'effective_from' => now()->subDays(7)->toDateString(),
            'effective_to' => now()->addMonths(6)->toDateString(),
            'mastery_threshold' => 75,
            'attainment_threshold' => 80,
            'gamified_weight' => 20,
            'formative_weight' => 40,
            'summative_weight' => 40,
            'weekly_summative_required' => true,
            'is_active' => true,
            'created_by' => User::factory()->teacher(),
        ];
    }

    public function sectionScoped(?int $sectionId = null): static
    {
        return $this->state(fn (): array => [
            'scope' => 'section',
            'section_id' => $sectionId ?? Section::factory(),
        ]);
    }
}
