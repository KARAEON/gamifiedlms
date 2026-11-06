<?php

namespace Database\Seeders;

use App\Enums\ActivityPhase;
use App\Enums\ActivityType;
use App\Enums\AttemptStatus;
use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\Attempt;
use App\Models\AttemptAnswer;
use App\Models\Choice;
use App\Models\GradingPolicy;
use App\Models\Lesson;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\Report;
use App\Models\ScoreRecord;
use App\Models\Section;
use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->firstOrCreate(
            ['email' => 'admin@glms.test'],
            [
                'name' => 'Elena Cruz',
                'role' => UserRole::ADMIN,
                'password' => Hash::make('password123'),
            ]
        );

        GradingPolicy::query()->firstOrCreate(
            [
                'name' => 'Default Enterprise Policy',
                'scope' => 'global',
                'subject' => null,
            ],
            [
                'mastery_threshold' => 75,
                'attainment_threshold' => 80,
                'gamified_weight' => 20,
                'formative_weight' => 40,
                'summative_weight' => 40,
                'weekly_summative_required' => true,
                'is_active' => true,
            ]
        );

        $teacher = User::query()->create([
            'name' => 'Maria Santos',
            'email' => 'teacher@glms.test',
            'role' => UserRole::TEACHER,
            'password' => Hash::make('password123'),
        ]);

        TeacherProfile::query()->create([
            'user_id' => $teacher->id,
            'title' => 'Grade 6 Science Teacher',
            'specialization' => 'Inquiry-Based Science Learning',
            'bio' => 'Focuses on activity-driven mastery, interventions, and learner confidence.',
        ]);

        $sections = collect([
            ['name' => 'Grade 6 - Aster', 'code' => 'G6-A'],
            ['name' => 'Grade 6 - Jade', 'code' => 'G6-J'],
            ['name' => 'Grade 6 - Orchid', 'code' => 'G6-O'],
        ])->map(function (array $section) use ($teacher): Section {
            $created = Section::query()->create([
                'name' => $section['name'],
                'code' => $section['code'],
                'description' => 'Science-focused section for gamified weekly lesson tracks.',
                'is_active' => true,
            ]);

            $created->teachers()->attach($teacher->id);

            return $created;
        });

        $students = $this->seedStudents($sections);
        $activities = $this->seedCurriculum($teacher);
        $this->seedAttemptsAndScores($students, $activities);

        Report::query()->create([
            'generated_by' => $teacher->id,
            'report_type' => 'summary',
            'title' => 'Quarter 1 Science Analytics Summary',
            'filters' => [
                'date_from' => now()->subDays(45)->toDateString(),
                'date_to' => now()->toDateString(),
            ],
            'remarks' => 'Learners need reinforcement on weather systems and force-motion interpretation.',
            'generated_at' => now()->subDays(1),
        ]);
    }

    /**
     * @return Collection<int, User>
     */
    protected function seedStudents(Collection $sections): Collection
    {
        return collect(range(1, 24))->map(function (int $index) use ($sections): User {
            $section = $sections[$index % $sections->count()];

            $student = User::query()->create([
                'name' => fake()->name(),
                'email' => "student{$index}@glms.test",
                'role' => UserRole::STUDENT,
                'password' => Hash::make('password123'),
            ]);

            StudentProfile::query()->create([
                'user_id' => $student->id,
                'section_id' => $section->id,
                'learner_reference' => 'LRN-'.str_pad((string) (300000 + $index), 6, '0', STR_PAD_LEFT),
                'birth_date' => now()->subYears(fake()->numberBetween(11, 13)),
                'guardian_name' => fake()->name(),
                'learning_goal' => fake()->randomElement([
                    'Improve science vocabulary and confidence.',
                    'Raise quiz average above 85%.',
                    'Practice visual identification activities.',
                ]),
            ]);

            return $student;
        });
    }

    /**
     * @return Collection<int, Activity>
     */
    protected function seedCurriculum(User $teacher): Collection
    {
        $blueprint = [
            [
                'lesson' => 'Earth and Space Systems',
                'description' => 'Explore the Earth, weather, and our solar neighborhood.',
                'topics' => [
                    'Layers of the Earth',
                    'Weather and Climate',
                    'Solar System Basics',
                ],
            ],
            [
                'lesson' => 'Living Things and Ecosystems',
                'description' => 'Understand organisms, habitats, and ecosystem balance.',
                'topics' => [
                    'Cells and Organisms',
                    'Food Chains and Webs',
                    'Adaptations and Survival',
                ],
            ],
            [
                'lesson' => 'Matter, Energy, and Motion',
                'description' => 'Learn how materials behave and how forces move objects.',
                'topics' => [
                    'States of Matter',
                    'Force and Motion',
                    'Electricity Basics',
                ],
            ],
        ];

        $activityTypes = ActivityType::cases();
        $activityIndex = 0;

        $activities = collect();

        foreach ($blueprint as $lessonSeed) {
            $lesson = Lesson::query()->create([
                'title' => $lessonSeed['lesson'],
                'slug' => Str::slug($lessonSeed['lesson']),
                'subject' => 'Science',
                'description' => $lessonSeed['description'],
                'is_active' => true,
                'created_by' => $teacher->id,
                'published_at' => now()->subDays(fake()->numberBetween(10, 40)),
            ]);

            foreach ($lessonSeed['topics'] as $topicTitle) {
                $topic = Topic::query()->create([
                    'lesson_id' => $lesson->id,
                    'title' => $topicTitle,
                    'slug' => Str::slug($lesson->title.' '.$topicTitle),
                    'summary' => "Skill-building activities for {$topicTitle}.",
                    'difficulty_level' => fake()->numberBetween(1, 3),
                    'is_active' => true,
                ]);

                foreach (range(1, 3) as $rank) {
                    $activityType = $activityTypes[$activityIndex % count($activityTypes)];
                    $activityIndex++;
                    $phase = match ($rank) {
                        1 => ActivityPhase::GAMIFIED,
                        2 => ActivityPhase::FORMATIVE,
                        default => ActivityPhase::SUMMATIVE,
                    };

                    $activity = Activity::query()->create([
                        'topic_id' => $topic->id,
                        'title' => "{$topicTitle} ".($phase === ActivityPhase::SUMMATIVE ? 'Weekly Test' : "Challenge {$rank}"),
                        'activity_type' => $activityType,
                        'instructional_phase' => $phase,
                        'instructions' => $this->instructionsByType($activityType),
                        'settings' => [
                            'passing_score' => 70,
                            'hint_enabled' => true,
                        ],
                        'max_score' => 100,
                        'allow_retry' => true,
                        'time_limit_seconds' => 240,
                        'is_active' => true,
                        'sort_order' => $rank,
                    ]);

                    $this->seedQuestions($activity);
                    $activities->push($activity->fresh('topic.lesson', 'questions.choices'));
                }
            }
        }

        return $activities;
    }

    protected function instructionsByType(ActivityType $type): string
    {
        return match ($type) {
            ActivityType::MULTIPLE_CHOICE => 'Read each question and choose the best answer.',
            ActivityType::MATCHING => 'Match each concept with the correct description.',
            ActivityType::GUESS_WORD => 'Use the clue to guess the science word.',
            ActivityType::PICS_WORD => 'Observe the picture clues and type the hidden word.',
            ActivityType::VISUAL_CHALLENGE => 'Look at the visual and identify what it represents.',
        };
    }

    protected function seedQuestions(Activity $activity): void
    {
        $bank = in_array($activity->instructional_phase?->value, [ActivityPhase::FORMATIVE->value, ActivityPhase::SUMMATIVE->value], true)
            ? QuestionBank::query()->firstOrCreate(['topic_id' => $activity->topic_id, 'phase' => $activity->instructional_phase->value])
            : null;
        foreach (range(1, 5) as $item) {
            $correctAnswer = $this->correctAnswerFor($activity, $item);

            $question = Question::query()->create([
                'activity_id' => $activity->id,
                'question_bank_id' => $bank?->id,
                'prompt' => $this->promptFor($activity, $item),
                'question_type' => $activity->activity_type->value,
                'payload' => $this->payloadFor($activity, $item, $correctAnswer),
                'correct_answer' => $correctAnswer,
                'points' => 20,
                'sort_order' => $item,
            ]);

            if (in_array($activity->activity_type, [ActivityType::MULTIPLE_CHOICE, ActivityType::VISUAL_CHALLENGE], true)) {
                foreach (['A', 'B', 'C', 'D'] as $letter) {
                    Choice::query()->create([
                        'question_id' => $question->id,
                        'label' => "{$letter}. ".$this->choiceContentFor($activity, $item, $letter),
                        'value' => $letter,
                        'is_correct' => $letter === $question->correct_answer,
                        'sort_order' => ord($letter),
                    ]);
                }
            }
        }
        if ($bank) {
            $activity->update(['is_active' => $bank->questions()->count() >= 50 && $bank->questions()->count() <= 100]);
        }
    }

    protected function promptFor(Activity $activity, int $index): string
    {
        $topic = $activity->topic->title;

        return match ($activity->activity_type) {
            ActivityType::MULTIPLE_CHOICE => "{$topic}: Question {$index} - choose the correct science fact.",
            ActivityType::MATCHING => "{$topic}: Match item {$index} with its correct meaning.",
            ActivityType::GUESS_WORD => "{$topic}: Guess the science word from clue {$index}.",
            ActivityType::PICS_WORD => "{$topic}: 4 Pics 1 Word clue set {$index}.",
            ActivityType::VISUAL_CHALLENGE => "{$topic}: Identify the visual shown in challenge {$index}.",
        };
    }

    protected function payloadFor(Activity $activity, int $index, string $correctAnswer): ?array
    {
        return match ($activity->activity_type) {
            ActivityType::MATCHING => [
                'pairs' => Question::matchingPairSetForOrder($index),
                'hint' => "Use the concept definitions from {$activity->topic->title}.",
            ],
            ActivityType::GUESS_WORD => [
                'answer' => $correctAnswer,
                'clue' => Question::wordClueByAnswer()[$correctAnswer] ?? 'Use the clue to guess the science word.',
                'image' => Question::guessWordImageByAnswer()[$correctAnswer] ?? null,
            ],
            ActivityType::PICS_WORD => [
                'answer' => $correctAnswer,
                'images' => Question::picsWordImageSet($correctAnswer),
                'clue' => Question::wordClueByAnswer()[$correctAnswer] ?? 'All clues point to one science word.',
            ],
            ActivityType::VISUAL_CHALLENGE => [
                'image' => Question::picsWordImageSet(
                    Question::demoPicsWordAnswers()[($index - 1) % count(Question::demoPicsWordAnswers())]
                )[0],
                'caption' => 'Study the image and answer the prompt.',
            ],
            default => null,
        };
    }

    protected function correctAnswerFor(Activity $activity, int $index): string
    {
        return match ($activity->activity_type) {
            ActivityType::MULTIPLE_CHOICE, ActivityType::VISUAL_CHALLENGE => ['A', 'B', 'C', 'D'][($index + 1) % 4],
            ActivityType::MATCHING => json_encode(collect(Question::matchingPairSetForOrder($index))
                ->mapWithKeys(static fn (array $pair): array => [$pair['key'] => $pair['right']])
                ->all(), JSON_THROW_ON_ERROR),
            ActivityType::GUESS_WORD => Question::demoGuessWordAnswers()[($index - 1) % count(Question::demoGuessWordAnswers())],
            ActivityType::PICS_WORD => Question::demoPicsWordAnswers()[($index - 1) % count(Question::demoPicsWordAnswers())],
        };
    }

    protected function choiceContentFor(Activity $activity, int $index, string $letter): string
    {
        return match ($activity->activity_type) {
            ActivityType::MULTIPLE_CHOICE => fake()->randomElement([
                'A scientist observes and records data.',
                'Heat can change the state of matter.',
                'Plants produce food by photosynthesis.',
                'Earth rotates once every 24 hours.',
            ]),
            ActivityType::VISUAL_CHALLENGE => "Visual option {$letter} for item {$index}",
            default => "Option {$letter}",
        };
    }

    protected function seedAttemptsAndScores(Collection $students, Collection $activities): void
    {
        foreach ($students as $studentIndex => $student) {
            $section = $student->studentProfile?->section;
            $selectedActivities = $activities->shuffle()->take(fake()->numberBetween(9, 13));

            foreach ($selectedActivities as $activity) {
                $questions = in_array($activity->instructional_phase?->value, [ActivityPhase::FORMATIVE->value, ActivityPhase::SUMMATIVE->value], true)
                    ? QuestionBank::query()->where('topic_id', $activity->topic_id)->where('phase', $activity->instructional_phase->value)->first()?->questions ?? collect()
                    : $activity->questions;
                $maxScore = max(1, $questions->sum('points'));
                $topicPenalty = str_contains(strtolower($activity->topic->title), 'weather') ? -12 : 0;
                $studentBias = ($studentIndex % 5 === 0) ? -10 : 6;
                $targetAccuracy = max(30, min(97, 68 + $studentBias + $topicPenalty + fake()->numberBetween(-16, 12)));

                $correctCounter = 0;
                $earnedScore = 0;
                $attemptStart = now()->subDays(fake()->numberBetween(1, 40))->subMinutes(fake()->numberBetween(5, 60));

                $attempt = Attempt::query()->create([
                    'student_id' => $student->id,
                    'section_id' => $section?->id,
                    'activity_id' => $activity->id,
                    'question_ids' => $questions->pluck('id')->map(fn ($id) => (int) $id)->all(),
                    'status' => AttemptStatus::COMPLETED,
                    'started_at' => $attemptStart,
                    'completed_at' => (clone $attemptStart)->addMinutes(fake()->numberBetween(3, 15)),
                    'attempt_number' => fake()->numberBetween(1, 3),
                    'max_score' => $maxScore,
                    'duration_seconds' => fake()->numberBetween(90, 900),
                ]);

                foreach ($questions as $question) {
                    $isCorrect = fake()->numberBetween(1, 100) <= $targetAccuracy;
                    $earnedPoints = $isCorrect ? $question->points : 0;
                    $correctCounter += $isCorrect ? 1 : 0;
                    $earnedScore += $earnedPoints;

                    [$responseText, $responseJson] = $this->answerPayload($question, $isCorrect);

                    AttemptAnswer::query()->create([
                        'attempt_id' => $attempt->id,
                        'question_id' => $question->id,
                        'response_text' => $responseText,
                        'response_json' => $responseJson,
                        'is_correct' => $isCorrect,
                        'earned_points' => $earnedPoints,
                        'answered_at' => now(),
                    ]);
                }

                $accuracy = round(($correctCounter / max(1, $questions->count())) * 100, 2);
                $attempt->update([
                    'score' => $earnedScore,
                    'accuracy' => $accuracy,
                    'feedback_summary' => $accuracy < 70
                        ? 'Needs support on concept retention and strategy.'
                        : 'Strong performance with consistent understanding.',
                ]);

                ScoreRecord::query()->create([
                    'student_id' => $student->id,
                    'section_id' => $section?->id,
                    'lesson_id' => $activity->topic->lesson_id,
                    'topic_id' => $activity->topic_id,
                    'activity_id' => $activity->id,
                    'attempt_id' => $attempt->id,
                    'score' => $earnedScore,
                    'max_score' => $maxScore,
                    'accuracy' => $accuracy,
                    'completion_status' => 'completed',
                    'attempted_at' => $attempt->completed_at,
                ]);
            }
        }
    }

    /**
     * @return array{0: string|null, 1: array<string, string>|null}
     */
    protected function answerPayload(Question $question, bool $isCorrect): array
    {
        return match ($question->question_type) {
            ActivityType::MATCHING->value => [
                null,
                $isCorrect
                    ? ['term_a' => 'Meaning A', 'term_b' => 'Meaning B']
                    : ['term_a' => 'Meaning B', 'term_b' => 'Meaning A'],
            ],
            ActivityType::GUESS_WORD->value,
            ActivityType::PICS_WORD->value => [
                $isCorrect ? $question->correct_answer : 'incorrect',
                null,
            ],
            default => [
                $isCorrect ? $question->correct_answer : fake()->randomElement(['A', 'B', 'C', 'D']),
                null,
            ],
        };
    }
}
