<?php

namespace App\Services;

use App\Models\GradeEntry;
use App\Models\ScoreRecord;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class GradeComputationService
{
    /** @var array<string, array<string, float>> */
    private const SUBJECT_WEIGHTS = [
        'English' => ['ww' => 0.40, 'pt' => 0.40, 'qa' => 0.20],
        'Mathematics' => ['ww' => 0.20, 'pt' => 0.60, 'qa' => 0.20],
        'Science' => ['ww' => 0.40, 'pt' => 0.40, 'qa' => 0.20],
    ];

    /**
     * @return list<string>
     */
    public function supportedSubjects(): array
    {
        return array_keys(self::SUBJECT_WEIGHTS);
    }

    /**
     * @return array<string, mixed>
     */
    public function computeForStudentSubjectQuarter(User $student, string $subject, int $quarter): array
    {
        if (! array_key_exists($subject, self::SUBJECT_WEIGHTS)) {
            return [
                'student_name' => $student->name,
                'subject' => $subject,
                'quarter' => $quarter,
                'error' => 'Unsupported subject. Only English, Mathematics, and Science are allowed.',
            ];
        }

        $weights = self::SUBJECT_WEIGHTS[$subject];

        $wwRecords = ScoreRecord::query()
            ->where('student_id', $student->id)
            ->whereHas('lesson', fn ($builder) => $builder->where('subject', $subject))
            ->whereBetween('attempted_at', $this->quarterDateRange($quarter))
            ->get(['score', 'max_score']);

        $entry = Schema::hasTable('grade_entries')
            ? GradeEntry::query()
                ->where('student_id', $student->id)
                ->where('subject', $subject)
                ->where('quarter', $quarter)
                ->first()
            : null;

        $writtenWorks = $this->computeComponent(
            $wwRecords->sum('score'),
            $wwRecords->sum('max_score'),
            $weights['ww']
        );

        [$ptTotal, $ptHpsTotal, $ptItems, $ptHpsItems] = $this->resolvePerformanceTaskValues($entry);

        $performanceTasks = $this->computeComponent(
            $ptTotal,
            $ptHpsTotal,
            $weights['pt']
        );

        $quarterlyAssessment = $this->computeComponent(
            $entry?->quarterly_assessment_score,
            $entry?->quarterly_assessment_hps,
            $weights['qa']
        );

        $initialGrade = null;
        if ($writtenWorks['weighted_score'] !== null && $performanceTasks['weighted_score'] !== null && $quarterlyAssessment['weighted_score'] !== null) {
            $initialGrade = round(
                $writtenWorks['weighted_score']
                + $performanceTasks['weighted_score']
                + $quarterlyAssessment['weighted_score'],
                2
            );
        }

        $quarterlyGrade = $initialGrade !== null ? $this->transmute($initialGrade) : null;

        $quarterGrades = [];
        for ($index = 1; $index <= 4; $index++) {
            $quarterGrades['q'.$index] = $index === $quarter
                ? $quarterlyGrade
                : $this->computeQuarterlyGradeOnly($student, $subject, $index);
        }

        $allQuarterGradesPresent = collect($quarterGrades)->every(fn ($value) => $value !== null);
        $finalGrade = $allQuarterGradesPresent
            ? (int) round(array_sum($quarterGrades) / 4, 0)
            : null;

        $remark = $finalGrade === null ? null : ($finalGrade >= 75 ? 'PASSED' : 'FAILED');

        return [
            'student_name' => $student->name,
            'subject' => $subject,
            'quarter' => $quarter,
            'weights' => [
                'written_works' => $weights['ww'],
                'performance_tasks' => $weights['pt'],
                'quarterly_assessment' => $weights['qa'],
            ],
            'written_works' => $writtenWorks,
            'performance_tasks' => $performanceTasks,
            'performance_task_items' => $ptItems,
            'performance_task_hps_items' => $ptHpsItems,
            'quarterly_assessment' => [
                'score' => $entry?->quarterly_assessment_score,
                'hps' => $entry?->quarterly_assessment_hps,
                'percentage_score' => $quarterlyAssessment['percentage_score'],
                'weighted_score' => $quarterlyAssessment['weighted_score'],
            ],
            'initial_grade' => $initialGrade,
            'quarterly_grade' => $quarterlyGrade,
            'yearly_summary' => [
                ...$quarterGrades,
                'final_grade' => $finalGrade,
                'remark' => $remark,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function computeSubjectSummary(User $student, string $subject): array
    {
        return [
            'subject' => $subject,
            'quarters' => collect(range(1, 4))
                ->mapWithKeys(fn (int $quarter) => [$quarter => $this->computeForStudentSubjectQuarter($student, $subject, $quarter)])
                ->all(),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function computeAllSubjects(User $student): Collection
    {
        return collect($this->supportedSubjects())
            ->map(fn (string $subject) => $this->computeSubjectSummary($student, $subject));
    }

    /**
     * @return array{total: float|int|null, hps_total: float|int|null, percentage_score: float|null, weighted_score: float|null}
     */
    private function computeComponent(float|int|null $total, float|int|null $hpsTotal, float $weight): array
    {
        $percentageScore = null;
        if ($hpsTotal !== null && (float) $hpsTotal > 0) {
            $percentageScore = round((((float) $total) / ((float) $hpsTotal)) * 100, 2);
        }

        $weightedScore = $percentageScore !== null ? round($percentageScore * $weight, 2) : null;

        return [
            'total' => $total,
            'hps_total' => $hpsTotal,
            'percentage_score' => $percentageScore,
            'weighted_score' => $weightedScore,
        ];
    }

    private function computeQuarterlyGradeOnly(User $student, string $subject, int $quarter): ?int
    {
        $weights = self::SUBJECT_WEIGHTS[$subject] ?? null;
        if ($weights === null) {
            return null;
        }

        $wwRecords = ScoreRecord::query()
            ->where('student_id', $student->id)
            ->whereHas('lesson', fn ($builder) => $builder->where('subject', $subject))
            ->whereBetween('attempted_at', $this->quarterDateRange($quarter))
            ->get(['score', 'max_score']);

        $entry = Schema::hasTable('grade_entries')
            ? GradeEntry::query()
                ->where('student_id', $student->id)
                ->where('subject', $subject)
                ->where('quarter', $quarter)
                ->first()
            : null;

        $ww = $this->computeComponent($wwRecords->sum('score'), $wwRecords->sum('max_score'), $weights['ww']);
        [$ptTotal, $ptHpsTotal] = $this->resolvePerformanceTaskValues($entry);
        $pt = $this->computeComponent($ptTotal, $ptHpsTotal, $weights['pt']);
        $qa = $this->computeComponent($entry?->quarterly_assessment_score, $entry?->quarterly_assessment_hps, $weights['qa']);

        if ($ww['weighted_score'] === null || $pt['weighted_score'] === null || $qa['weighted_score'] === null) {
            return null;
        }

        return $this->transmute(round($ww['weighted_score'] + $pt['weighted_score'] + $qa['weighted_score'], 2));
    }

    private function transmute(float $initialGrade): int
    {
        return match (true) {
            $initialGrade < 4.00 => 60,
            $initialGrade < 8.00 => 61,
            $initialGrade < 12.00 => 62,
            $initialGrade < 16.00 => 63,
            $initialGrade < 20.00 => 64,
            $initialGrade < 24.00 => 65,
            $initialGrade < 28.00 => 66,
            $initialGrade < 32.00 => 67,
            $initialGrade < 36.00 => 68,
            $initialGrade < 40.00 => 69,
            $initialGrade < 44.00 => 70,
            $initialGrade < 48.00 => 71,
            $initialGrade < 52.00 => 72,
            $initialGrade < 56.00 => 73,
            $initialGrade < 60.00 => 74,
            $initialGrade < 61.60 => 75,
            $initialGrade < 63.20 => 76,
            $initialGrade < 64.80 => 77,
            $initialGrade < 66.40 => 78,
            $initialGrade < 68.00 => 79,
            $initialGrade < 69.60 => 80,
            $initialGrade < 71.20 => 81,
            $initialGrade < 72.80 => 82,
            $initialGrade < 74.40 => 83,
            $initialGrade < 76.00 => 84,
            $initialGrade < 77.60 => 85,
            $initialGrade < 79.20 => 86,
            $initialGrade < 80.80 => 87,
            $initialGrade < 82.40 => 88,
            $initialGrade < 84.00 => 89,
            $initialGrade < 85.60 => 90,
            $initialGrade < 87.20 => 91,
            $initialGrade < 88.80 => 92,
            $initialGrade < 90.40 => 93,
            $initialGrade < 92.00 => 94,
            $initialGrade < 93.60 => 95,
            $initialGrade < 95.20 => 96,
            $initialGrade < 96.80 => 97,
            $initialGrade < 98.40 => 98,
            $initialGrade < 100.00 => 99,
            default => 100,
        };
    }

    /**
     * @return array{0: float|int|null, 1: float|int|null, 2: array<int, float|int|null>, 3: array<int, float|int|null>}
     */
    private function resolvePerformanceTaskValues(?GradeEntry $entry): array
    {
        $items = collect($entry?->performance_task_items ?? [])->take(10)->pad(10, null)->map(
            fn ($value) => $value === null || $value === '' ? null : (float) $value
        )->values()->all();

        $hpsItems = collect($entry?->performance_task_hps_items ?? [])->take(10)->pad(10, null)->map(
            fn ($value) => $value === null || $value === '' ? null : (float) $value
        )->values()->all();

        $hasItemized = collect($items)->filter(fn ($value) => $value !== null)->isNotEmpty()
            || collect($hpsItems)->filter(fn ($value) => $value !== null)->isNotEmpty();

        if ($hasItemized) {
            return [
                round((float) collect($items)->filter(fn ($value) => $value !== null)->sum(), 2),
                round((float) collect($hpsItems)->filter(fn ($value) => $value !== null)->sum(), 2),
                $items,
                $hpsItems,
            ];
        }

        return [
            $entry?->performance_task_score,
            $entry?->performance_task_hps,
            $items,
            $hpsItems,
        ];
    }

    /**
     * @return array{0: \Carbon\Carbon, 1: \Carbon\Carbon}
     */
    private function quarterDateRange(int $quarter): array
    {
        $quarter = max(1, min(4, $quarter));
        $year = now()->year;
        $startMonth = (($quarter - 1) * 3) + 1;

        $start = Carbon::create($year, $startMonth, 1)->startOfDay();
        $end = (clone $start)->addMonths(2)->endOfMonth()->endOfDay();

        return [$start, $end];
    }
}