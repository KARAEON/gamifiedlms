<?php

namespace Database\Factories;

use App\Models\Activity;
use App\Models\Attempt;
use App\Models\Lesson;
use App\Models\ScoreRecord;
use App\Models\Section;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScoreRecord>
 */
class ScoreRecordFactory extends Factory
{
    protected $model = ScoreRecord::class;

    public function definition(): array
    {
        $score = fake()->numberBetween(45, 100);

        return [
            'student_id' => User::factory()->student(),
            'section_id' => Section::factory(),
            'lesson_id' => Lesson::factory(),
            'topic_id' => Topic::factory(),
            'activity_id' => Activity::factory(),
            'attempt_id' => Attempt::factory(),
            'score' => $score,
            'max_score' => 100,
            'accuracy' => $score,
            'completion_status' => 'completed',
            'attempted_at' => now()->subDays(fake()->numberBetween(1, 30)),
        ];
    }
}

