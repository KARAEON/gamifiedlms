<?php

namespace Database\Factories;

use App\Models\Section;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Section>
 */
class SectionFactory extends Factory
{
    protected $model = Section::class;

    public function definition(): array
    {
        $name = 'Grade 6 - '.fake()->randomElement(['Aster', 'Jade', 'Orchid', 'Emerald']);

        return [
            'name' => $name,
            'code' => Str::upper(Str::slug($name)).'-'.fake()->numberBetween(10, 99),
            'description' => fake()->sentence(8),
            'is_active' => true,
        ];
    }
}

