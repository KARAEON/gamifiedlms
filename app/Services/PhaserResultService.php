<?php

namespace App\Services;

use App\Models\PhaserGameResult;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PhaserResultService
{
    public function __construct(
        private readonly PhaserLessonAccessService $phaserLessonAccessService,
    ) {
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{created: bool, result: PhaserGameResult}
     */
    public function store(User $student, array $data): array
    {
        $existing = PhaserGameResult::query()
            ->where('submission_uuid', $data['submission_uuid'])
            ->first();

        if ($existing) {
            if ((int) $existing->student_id !== (int) $student->id) {
                throw ValidationException::withMessages([
                    'submission_uuid' => 'This submission already belongs to another student.',
                ]);
            }

            return [
                'created' => false,
                'result' => $existing,
            ];
        }

        $this->phaserLessonAccessService->ensureUnlocked(
            $student->studentProfile?->section_id,
            (string) $data['lesson_key'],
        );

        $scored = $data['entry_type'] === 'assessment'
            ? $this->scoreAssessment(
                (string) $data['lesson_key'],
                (string) $data['game_key'],
                (array) $data['payload'],
            )
            : $this->scoreMinigame(
                (string) $data['lesson_key'],
                (string) $data['game_key'],
                (array) $data['payload'],
            );

        $attemptNumber = $this->nextAttemptNumber(
            $student->id,
            $scored['entry_type'],
            $scored['lesson_key'],
            $scored['game_key'],
        );

        $result = DB::transaction(function () use ($student, $data, $scored, $attemptNumber): PhaserGameResult {
            return PhaserGameResult::query()->create([
                'student_id' => $student->id,
                'section_id' => $student->studentProfile?->section_id,
                'lesson_key' => $scored['lesson_key'],
                'lesson_title' => $scored['lesson_title'],
                'game_key' => $scored['game_key'],
                'entry_type' => $scored['entry_type'],
                'phase' => $scored['phase'],
                'game_title' => $scored['game_title'],
                'topic_title' => $scored['topic_title'],
                'submission_uuid' => $data['submission_uuid'],
                'attempt_number' => $attemptNumber,
                'score' => $scored['score'],
                'max_score' => $scored['max_score'],
                'accuracy' => $scored['accuracy'],
                'result_status' => $scored['result_status'],
                'payload' => [
                    'input' => $data['payload'],
                    'derived' => $scored['derived'],
                ],
                'completed_at' => now(),
            ]);
        });

        return [
            'created' => true,
            'result' => $result,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function scoreMinigame(string $lessonKey, string $gameKey, array $payload): array
    {
        $lesson = $this->lessonConfig($lessonKey);
        $game = Arr::get($lesson, 'minigame');

        if (! is_array($game) || ($game['game_key'] ?? null) !== $gameKey) {
            throw ValidationException::withMessages([
                'game_key' => 'The selected Phaser minigame is invalid.',
            ]);
        }

        $scored = match ($gameKey) {
            'mix-match-memory-quest' => $this->scoreMixMatch($game, $payload),
            'supply-cart-sorting' => $this->scoreSupplyCart($game, $payload),
            'mixture-detective' => $this->scoreMixtureDetective($game, $payload),
            'science-court' => $this->scoreScienceCourt($game, $payload),
            'invent-a-mix-workshop' => $this->scoreInventMix($game, $payload),
            default => throw ValidationException::withMessages([
                'game_key' => 'The selected Phaser minigame is not supported.',
            ]),
        };

        return [
            'lesson_key' => $lessonKey,
            'lesson_title' => (string) $lesson['title'],
            'game_key' => $gameKey,
            'entry_type' => 'minigame',
            'phase' => (string) $game['phase'],
            'game_title' => (string) $game['title'],
            'topic_title' => (string) $lesson['topic_title'],
            'score' => $scored['score'],
            'max_score' => $scored['max_score'],
            'accuracy' => $scored['accuracy'],
            'result_status' => $scored['result_status'],
            'derived' => $scored['derived'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function scoreAssessment(string $lessonKey, string $gameKey, array $payload): array
    {
        $lesson = $this->lessonConfig($lessonKey);
        $assessment = Arr::get($lesson, 'assessment');

        if (! is_array($assessment) || ($assessment['game_key'] ?? null) !== $gameKey) {
            throw ValidationException::withMessages([
                'game_key' => 'The selected Phaser assessment is invalid.',
            ]);
        }

        $answers = Arr::get($payload, 'answers');
        if (! is_array($answers)) {
            throw ValidationException::withMessages([
                'payload.answers' => 'Assessment answers are required.',
            ]);
        }

        $items = $assessment['items'];
        $itemIds = array_map(static fn (array $item): string => (string) $item['id'], $items);

        foreach ($itemIds as $itemId) {
            if (! array_key_exists($itemId, $answers)) {
                throw ValidationException::withMessages([
                    'payload.answers' => "Missing answer for {$itemId}.",
                ]);
            }
        }

        $correctCount = 0;
        $gradedItems = [];

        foreach ($items as $item) {
            $itemId = (string) $item['id'];
            $expected = (string) $item['answer'];
            $actual = $this->normalizeStringAnswer($answers[$itemId] ?? null);

            if ($actual === '') {
                throw ValidationException::withMessages([
                    'payload.answers' => "Answer for {$itemId} cannot be empty.",
                ]);
            }

            $isCorrect = $this->normalizeStringAnswer($expected) === $actual;
            $correctCount += $isCorrect ? 1 : 0;
            $gradedItems[] = [
                'id' => $itemId,
                'expected' => $expected,
                'actual' => (string) ($answers[$itemId] ?? ''),
                'is_correct' => $isCorrect,
            ];
        }

        $maxScore = (float) count($items);
        $score = (float) $correctCount;
        $accuracy = $maxScore > 0 ? round(($score / $maxScore) * 100, 2) : 0.0;
        $status = $accuracy >= (float) $assessment['pass_percent'] ? 'pass' : 'fail';

        return [
            'lesson_key' => $lessonKey,
            'lesson_title' => (string) $lesson['title'],
            'game_key' => $gameKey,
            'entry_type' => 'assessment',
            'phase' => (string) $assessment['phase'],
            'game_title' => (string) $assessment['title'],
            'topic_title' => (string) $lesson['topic_title'],
            'score' => $score,
            'max_score' => $maxScore,
            'accuracy' => $accuracy,
            'result_status' => $status,
            'derived' => [
                'correct_count' => $correctCount,
                'pass_percent' => (int) $assessment['pass_percent'],
                'graded_items' => $gradedItems,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $game
     * @param  array<string, mixed>  $payload
     * @return array{score: float, max_score: float, accuracy: float, result_status: string, derived: array<string, mixed>}
     */
    private function scoreMixMatch(array $game, array $payload): array
    {
        $totalSets = (int) $game['total_sets'];
        $matchedSetCount = $this->intPayload($payload, 'matched_set_count', 0, $totalSets);
        $fastMatchCount = $this->intPayload($payload, 'fast_match_count', 0, $matchedSetCount);
        $finishedAll = $this->boolPayload($payload, 'finished_all');

        $score = ($matchedSetCount * (int) $game['score']['correct'])
            + ($fastMatchCount * (int) $game['score']['fast_bonus'])
            + ($finishedAll ? (int) $game['score']['finish_early'] : 0);
        $maxScore = ($totalSets * (int) $game['score']['correct'])
            + ($totalSets * (int) $game['score']['fast_bonus'])
            + (int) $game['score']['finish_early'];
        $accuracy = round(($matchedSetCount / max(1, $totalSets)) * 100, 2);

        return [
            'score' => (float) $score,
            'max_score' => (float) $maxScore,
            'accuracy' => $accuracy,
            'result_status' => $finishedAll && $matchedSetCount === $totalSets ? 'win' : 'lose',
            'derived' => [
                'matched_set_count' => $matchedSetCount,
                'fast_match_count' => $fastMatchCount,
                'finished_all' => $finishedAll,
                'time_remaining_seconds' => $this->floatPayload($payload, 'time_remaining_seconds', 0),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $game
     * @param  array<string, mixed>  $payload
     * @return array{score: float, max_score: float, accuracy: float, result_status: string, derived: array<string, mixed>}
     */
    private function scoreSupplyCart(array $game, array $payload): array
    {
        $totalItems = (int) $game['total_items'];
        $correctSortCount = $this->intPayload($payload, 'correct_sort_count', 0, $totalItems);
        $sortAttemptCount = $this->intPayload($payload, 'sort_attempt_count', 0);
        $correctUseCount = $this->intPayload($payload, 'correct_use_count', 0, $totalItems);
        $completedItemCount = $this->intPayload($payload, 'completed_item_count', 0, $totalItems);

        if ($completedItemCount < $correctUseCount) {
            throw ValidationException::withMessages([
                'payload.completed_item_count' => 'Completed item count cannot be lower than correct use count.',
            ]);
        }

        $score = ($correctSortCount * (int) $game['score']['correct_sort'])
            + ($correctUseCount * (int) $game['score']['correct_use']);
        $maxScore = $totalItems * ((int) $game['score']['correct_sort'] + (int) $game['score']['correct_use']);
        $accuracy = round(($correctSortCount / max(1, $sortAttemptCount)) * 100, 2);
        $isWin = $completedItemCount === $totalItems && $accuracy >= (float) $game['accuracy_target'];

        return [
            'score' => (float) $score,
            'max_score' => (float) $maxScore,
            'accuracy' => $accuracy,
            'result_status' => $isWin ? 'win' : 'lose',
            'derived' => [
                'correct_sort_count' => $correctSortCount,
                'sort_attempt_count' => $sortAttemptCount,
                'correct_use_count' => $correctUseCount,
                'completed_item_count' => $completedItemCount,
                'best_combo' => $this->intPayload($payload, 'best_combo', 0),
                'time_remaining_seconds' => $this->floatPayload($payload, 'time_remaining_seconds', 0),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $game
     * @param  array<string, mixed>  $payload
     * @return array{score: float, max_score: float, accuracy: float, result_status: string, derived: array<string, mixed>}
     */
    private function scoreMixtureDetective(array $game, array $payload): array
    {
        $questionCount = (int) $game['question_count'];
        $correctQuestionCount = $this->intPayload($payload, 'correct_question_count', 0, $questionCount);
        $mistakeCount = $this->intPayload($payload, 'mistake_count', 0, (int) $game['max_mistakes']);
        $finalSelections = $this->arrayPayload($payload, 'final_selections');
        $finalCorrect = $finalSelections === $game['final_comparison'];

        $score = ($correctQuestionCount * (int) $game['score']['correct_question'])
            + ($finalCorrect ? (int) $game['score']['final_comparison'] : 0);
        $maxScore = ($questionCount * (int) $game['score']['correct_question']) + (int) $game['score']['final_comparison'];
        $accuracy = $maxScore > 0 ? round(($score / $maxScore) * 100, 2) : 0.0;
        $isWin = $finalCorrect && $correctQuestionCount === $questionCount;

        return [
            'score' => (float) $score,
            'max_score' => (float) $maxScore,
            'accuracy' => $accuracy,
            'result_status' => $isWin ? 'win' : 'lose',
            'derived' => [
                'correct_question_count' => $correctQuestionCount,
                'mistake_count' => $mistakeCount,
                'final_correct' => $finalCorrect,
                'final_selections' => $finalSelections,
                'time_remaining_seconds' => $this->floatPayload($payload, 'time_remaining_seconds', 0),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $game
     * @param  array<string, mixed>  $payload
     * @return array{score: float, max_score: float, accuracy: float, result_status: string, derived: array<string, mixed>}
     */
    private function scoreScienceCourt(array $game, array $payload): array
    {
        $submittedCases = $this->arrayPayload($payload, 'cases');
        $caseConfigs = collect($game['cases'])->keyBy('id');
        $caseCount = $caseConfigs->count();

        if (count($submittedCases) !== $caseCount) {
            throw ValidationException::withMessages([
                'payload.cases' => 'All Science Court cases must be submitted.',
            ]);
        }

        $totalScore = 0;
        $gradedCases = [];
        $submittedIds = [];

        foreach ($submittedCases as $case) {
            if (! is_array($case)) {
                throw ValidationException::withMessages([
                    'payload.cases' => 'Each submitted case must be an object.',
                ]);
            }

            $caseId = (string) ($case['case_id'] ?? '');
            $classification = (string) ($case['classification'] ?? '');
            $evidenceIds = array_values(array_unique(array_map(
                static fn (mixed $value): string => (string) $value,
                is_array($case['evidence_ids'] ?? null) ? $case['evidence_ids'] : [],
            )));

            if ($caseId === '' || $classification === '') {
                throw ValidationException::withMessages([
                    'payload.cases' => 'Each case needs a case_id and classification.',
                ]);
            }

            if (in_array($caseId, $submittedIds, true)) {
                throw ValidationException::withMessages([
                    'payload.cases' => "Case {$caseId} was submitted more than once.",
                ]);
            }

            $submittedIds[] = $caseId;
            $caseConfig = $caseConfigs->get($caseId);
            if (! is_array($caseConfig)) {
                throw ValidationException::withMessages([
                    'payload.cases' => "Case {$caseId} is invalid.",
                ]);
            }

            $minEvidence = (int) Arr::get($caseConfig, 'evidence_pick.min', 0);
            $maxEvidence = (int) Arr::get($caseConfig, 'evidence_pick.max', 0);
            if (count($evidenceIds) < $minEvidence || count($evidenceIds) > $maxEvidence) {
                throw ValidationException::withMessages([
                    'payload.cases' => "Case {$caseId} has an invalid evidence count.",
                ]);
            }

            $caseScore = $classification === (string) $caseConfig['type']
                ? (int) $game['score']['classification']
                : 0;
            $correctEvidenceCount = count(array_intersect($evidenceIds, $caseConfig['correct_evidence']));
            $caseScore += min(
                $correctEvidenceCount * (int) $game['score']['evidence'],
                (int) $game['score']['evidence_cap'],
            );
            $totalScore += $caseScore;

            $gradedCases[] = [
                'case_id' => $caseId,
                'classification' => $classification,
                'evidence_ids' => $evidenceIds,
                'score' => $caseScore,
            ];
        }

        $maxScore = (float) $game['max_score'];
        $accuracy = $maxScore > 0 ? round(($totalScore / $maxScore) * 100, 2) : 0.0;

        return [
            'score' => (float) $totalScore,
            'max_score' => $maxScore,
            'accuracy' => $accuracy,
            'result_status' => $totalScore >= (int) $game['win_score'] ? 'win' : 'lose',
            'derived' => [
                'cases' => $gradedCases,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $game
     * @param  array<string, mixed>  $payload
     * @return array{score: float, max_score: float, accuracy: float, result_status: string, derived: array<string, mixed>}
     */
    private function scoreInventMix(array $game, array $payload): array
    {
        $submittedMissions = $this->arrayPayload($payload, 'missions');
        $missionConfigs = collect($game['missions'])->keyBy('id');
        $missionCount = $missionConfigs->count();

        if (count($submittedMissions) !== $missionCount) {
            throw ValidationException::withMessages([
                'payload.missions' => 'All Invent-a-Mix missions must be submitted.',
            ]);
        }

        $totalScore = 0;
        $gradedMissions = [];
        $submittedIds = [];

        foreach ($submittedMissions as $mission) {
            if (! is_array($mission)) {
                throw ValidationException::withMessages([
                    'payload.missions' => 'Each mission must be an object.',
                ]);
            }

            $missionId = (string) ($mission['mission_id'] ?? '');
            $classification = (string) ($mission['classification'] ?? '');
            $appearance = (string) ($mission['appearance'] ?? '');
            $use = (string) ($mission['use'] ?? '');
            $selectedIngredients = array_values(array_unique(array_map(
                static fn (mixed $value): string => (string) $value,
                is_array($mission['selected_ingredients'] ?? null) ? $mission['selected_ingredients'] : [],
            )));

            if ($missionId === '' || $classification === '' || $appearance === '' || $use === '') {
                throw ValidationException::withMessages([
                    'payload.missions' => 'Each mission needs a mission_id, classification, appearance, and use.',
                ]);
            }

            if (in_array($missionId, $submittedIds, true)) {
                throw ValidationException::withMessages([
                    'payload.missions' => "Mission {$missionId} was submitted more than once.",
                ]);
            }

            $submittedIds[] = $missionId;
            $missionConfig = $missionConfigs->get($missionId);
            if (! is_array($missionConfig)) {
                throw ValidationException::withMessages([
                    'payload.missions' => "Mission {$missionId} is invalid.",
                ]);
            }

            $hasExactIngredients = count($selectedIngredients) === count($missionConfig['correct_ingredients'])
                && empty(array_diff($missionConfig['correct_ingredients'], $selectedIngredients));

            $missionScore = 0;
            $missionScore += $classification === (string) $missionConfig['type'] ? (int) $game['score']['classification'] : 0;
            $missionScore += $appearance === (string) $missionConfig['appearance'] ? (int) $game['score']['appearance'] : 0;
            $missionScore += $use === (string) $missionConfig['use'] ? (int) $game['score']['use'] : 0;
            $missionScore += $hasExactIngredients ? (int) $game['score']['valid_mixture'] : 0;
            $missionScore += (int) $game['score']['creativity'];
            $totalScore += $missionScore;

            $gradedMissions[] = [
                'mission_id' => $missionId,
                'score' => $missionScore,
                'custom_name' => Str::limit(trim((string) ($mission['custom_name'] ?? '')), 64, ''),
                'selected_ingredients' => $selectedIngredients,
                'classification' => $classification,
                'appearance' => $appearance,
                'use' => $use,
                'has_exact_ingredients' => $hasExactIngredients,
            ];
        }

        $maxScore = (float) $game['max_score'];
        $accuracy = $maxScore > 0 ? round(($totalScore / $maxScore) * 100, 2) : 0.0;

        return [
            'score' => (float) $totalScore,
            'max_score' => $maxScore,
            'accuracy' => $accuracy,
            'result_status' => $totalScore >= (int) $game['win_score'] ? 'win' : 'lose',
            'derived' => [
                'missions' => $gradedMissions,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function lessonConfig(string $lessonKey): array
    {
        $lesson = config("phaser.lessons.{$lessonKey}");

        if (! is_array($lesson)) {
            throw ValidationException::withMessages([
                'lesson_key' => 'The selected Phaser lesson is invalid.',
            ]);
        }

        return $lesson;
    }

    private function nextAttemptNumber(int $studentId, string $entryType, string $lessonKey, string $gameKey): int
    {
        $query = PhaserGameResult::query()
            ->where('student_id', $studentId)
            ->where('entry_type', $entryType);

        if ($entryType === 'assessment') {
            $query->where('lesson_key', $lessonKey);
        } else {
            $query->where('game_key', $gameKey);
        }

        return (int) $query->count() + 1;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function intPayload(array $payload, string $key, int $min = 0, ?int $max = null): int
    {
        $value = Arr::get($payload, $key);

        if (! is_numeric($value)) {
            throw ValidationException::withMessages([
                "payload.{$key}" => "The {$key} value must be numeric.",
            ]);
        }

        $int = (int) $value;
        if ($int < $min || ($max !== null && $int > $max)) {
            throw ValidationException::withMessages([
                "payload.{$key}" => "The {$key} value is out of range.",
            ]);
        }

        return $int;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function floatPayload(array $payload, string $key, float $min = 0): float
    {
        $value = Arr::get($payload, $key);

        if (! is_numeric($value)) {
            throw ValidationException::withMessages([
                "payload.{$key}" => "The {$key} value must be numeric.",
            ]);
        }

        $float = (float) $value;
        if ($float < $min) {
            throw ValidationException::withMessages([
                "payload.{$key}" => "The {$key} value is out of range.",
            ]);
        }

        return round($float, 2);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function boolPayload(array $payload, string $key): bool
    {
        $value = Arr::get($payload, $key);
        if (! is_bool($value)) {
            throw ValidationException::withMessages([
                "payload.{$key}" => "The {$key} value must be true or false.",
            ]);
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function arrayPayload(array $payload, string $key): array
    {
        $value = Arr::get($payload, $key);
        if (! is_array($value)) {
            throw ValidationException::withMessages([
                "payload.{$key}" => "The {$key} value must be an array.",
            ]);
        }

        return $value;
    }

    private function normalizeStringAnswer(mixed $value): string
    {
        return Str::of((string) $value)
            ->trim()
            ->squish()
            ->lower()
            ->value();
    }
}
