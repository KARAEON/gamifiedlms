<?php

namespace App\Services;

use App\Enums\AttemptStatus;
use App\Models\Activity;
use App\Models\Attempt;
use App\Models\AttemptAnswer;
use App\Models\Question;
use App\Models\ScoreRecord;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class ActivityScoringService
{
    /**
     * @param  array<string, mixed>  $responses
     */
    public function evaluateAndStore(User $student, Activity $activity, array $responses, int $durationSeconds = 0): Attempt
    {
        $activity->loadMissing('topic.lesson', 'questions.choices');
        $questions = $activity->questions;

        $maxScore = (float) $questions->sum('points');
        $totalCorrect = 0;
        $earnedScore = 0.0;

        $attemptNumber = Attempt::query()
            ->where('student_id', $student->id)
            ->where('activity_id', $activity->id)
            ->count() + 1;

        $startedAt = Carbon::now()->subSeconds(max($durationSeconds, 1));
        $completedAt = Carbon::now();

        $attempt = Attempt::query()->create([
            'student_id' => $student->id,
            'section_id' => $student->studentProfile?->section_id,
            'activity_id' => $activity->id,
            'status' => AttemptStatus::COMPLETED,
            'started_at' => $startedAt,
            'completed_at' => $completedAt,
            'attempt_number' => $attemptNumber,
            'max_score' => $maxScore,
            'duration_seconds' => $durationSeconds,
        ]);

        foreach ($questions as $question) {
            $response = $responses[$question->id] ?? null;
            [$isCorrect, $normalizedResponse] = $this->evaluateQuestion($question, $response);

            $earnedPoints = $isCorrect ? (float) $question->points : 0.0;
            $earnedScore += $earnedPoints;
            $totalCorrect += $isCorrect ? 1 : 0;

            AttemptAnswer::query()->create([
                'attempt_id' => $attempt->id,
                'question_id' => $question->id,
                'response_text' => is_scalar($normalizedResponse) ? (string) $normalizedResponse : null,
                'response_json' => is_array($normalizedResponse) ? $normalizedResponse : null,
                'is_correct' => $isCorrect,
                'earned_points' => $earnedPoints,
                'answered_at' => $completedAt,
            ]);
        }

        $accuracy = round(($totalCorrect / max(1, $questions->count())) * 100, 2);
        $attempt->update([
            'score' => $earnedScore,
            'accuracy' => $accuracy,
            'feedback_summary' => $accuracy >= 80
                ? 'Great work! Keep practicing to maintain mastery.'
                : 'Review the lesson tips and retry for a higher score.',
        ]);

        ScoreRecord::query()->create([
            'student_id' => $student->id,
            'section_id' => $student->studentProfile?->section_id,
            'lesson_id' => $activity->topic?->lesson_id,
            'topic_id' => $activity->topic_id,
            'activity_id' => $activity->id,
            'attempt_id' => $attempt->id,
            'score' => $earnedScore,
            'max_score' => $maxScore,
            'accuracy' => $accuracy,
            'completion_status' => 'completed',
            'attempted_at' => $completedAt,
        ]);

        return $attempt->fresh(['answers.question', 'activity.topic.lesson']);
    }

    /**
     * @param  mixed  $response
     * @return array{0: bool, 1: mixed}
     */
    protected function evaluateQuestion(Question $question, mixed $response): array
    {
        if (is_string($response)) {
            $normalized = trim($response);
        } elseif (is_array($response)) {
            $normalized = Arr::sortRecursive(array_map(
                static fn (mixed $value): mixed => is_string($value) ? trim($value) : $value,
                $response
            ));
        } else {
            $normalized = $response;
        }

        return match ($question->question_type) {
            'matching' => [
                $this->matchingAnswersAreCorrect($question, is_array($normalized) ? $normalized : []),
                $normalized,
            ],
            'guess_word', 'pics_word' => [
                strcasecmp($question->wordPuzzleAnswer(), (string) $normalized) === 0,
                $normalized,
            ],
            default => [
                (string) $question->correct_answer === (string) $normalized,
                $normalized,
            ],
        };
    }

    /**
     * @param  array<string, mixed>  $response
     */
    protected function matchingAnswersAreCorrect(Question $question, array $response): bool
    {
        $expected = $question->matchingCorrectMap();

        foreach ($expected as $key => $expectedValue) {
            $actualValue = trim((string) ($response[$key] ?? ''));
            if ($actualValue === '') {
                return false;
            }

            if (! $this->textsMatch($expectedValue, $actualValue)) {
                return false;
            }
        }

        return true;
    }

    protected function textsMatch(string $expected, string $actual): bool
    {
        $normalize = static function (string $text): string {
            $lower = Str::lower($text);
            $noPunctuation = preg_replace('/[^\\p{L}\\p{N}\\s]/u', '', $lower) ?? $lower;

            return preg_replace('/\\s+/u', ' ', trim($noPunctuation)) ?? trim($noPunctuation);
        };

        return $normalize($expected) === $normalize($actual);
    }
}
