<?php

namespace App\Services;

use App\Enums\ActivityPhase;
use App\Enums\UserRole;
use App\Models\ScoreRecord;
use App\Models\Section;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class AdminAnalyticsService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function dashboard(array $filters = []): array
    {
        $recordsQuery = $this->filteredRecordsQuery($filters);
        $records = $recordsQuery
            ->with(['section', 'topic.lesson', 'activity'])
            ->get();

        $totalStudents = User::query()->where('role', UserRole::STUDENT)->where('is_active', true)->count();
        $totalTeachers = User::query()->where('role', UserRole::TEACHER)->where('is_active', true)->count();
        $totalSections = Section::query()->where('is_active', true)->count();

        $overallMps = round((float) ($records->avg('accuracy') ?? 0), 2);
        $gradeDistribution = $this->distribution($records->pluck('accuracy')->map(fn ($value): float => (float) $value));

        $classPerformance = $records
            ->groupBy('section_id')
            ->map(function (Collection $sectionRecords): array {
                $section = $sectionRecords->first()?->section;
                $studentAverages = $sectionRecords
                    ->groupBy('student_id')
                    ->map(fn (Collection $rows): float => (float) ($rows->avg('accuracy') ?? 0));

                $mastered = $studentAverages->filter(fn (float $score): bool => $score >= 75)->count();
                $students = max(1, $studentAverages->count());

                return [
                    'section_id' => $section?->id,
                    'section' => $section?->name ?? 'Unassigned',
                    'grade' => $this->gradeFromSection($section?->name),
                    'attempts' => $sectionRecords->count(),
                    'learners' => $studentAverages->count(),
                    'mps' => round((float) ($sectionRecords->avg('accuracy') ?? 0), 2),
                    'attainment' => round(($mastered / $students) * 100, 2),
                ];
            })
            ->sortByDesc('mps')
            ->values();

        $subjectPerformance = $records
            ->groupBy(fn ($record): string => (string) ($record->topic?->lesson?->subject ?? 'Unspecified'))
            ->map(function (Collection $subjectRecords, string $subject): array {
                return [
                    'subject' => $subject,
                    'mps' => round((float) ($subjectRecords->avg('accuracy') ?? 0), 2),
                    'attempts' => $subjectRecords->count(),
                    'learners' => $subjectRecords->pluck('student_id')->unique()->count(),
                ];
            })
            ->sortByDesc('mps')
            ->values();

        $teacherSummaries = User::query()
            ->where('role', UserRole::TEACHER)
            ->where('is_active', true)
            ->with('handledSections:id,name')
            ->get()
            ->map(function (User $teacher) use ($records): array {
                $sectionIds = $teacher->handledSections->pluck('id');
                $teacherRecords = $records->whereIn('section_id', $sectionIds);

                return [
                    'teacher_id' => $teacher->id,
                    'teacher' => $teacher->name,
                    'sections' => $teacher->handledSections->pluck('name')->values()->all(),
                    'mps' => round((float) ($teacherRecords->avg('accuracy') ?? 0), 2),
                    'attempts' => $teacherRecords->count(),
                    'learners' => $teacherRecords->pluck('student_id')->unique()->count(),
                ];
            })
            ->sortByDesc('mps')
            ->values();

        $competencyPerformance = $records
            ->groupBy('topic_id')
            ->map(function (Collection $topicRecords): array {
                $sample = $topicRecords->first();
                $mps = round((float) ($topicRecords->avg('accuracy') ?? 0), 2);

                return [
                    'topic_id' => $sample?->topic_id,
                    'competency' => $sample?->topic?->title ?? 'Unknown Competency',
                    'lesson' => $sample?->topic?->lesson?->title ?? 'Unknown Lesson',
                    'subject' => $sample?->topic?->lesson?->subject ?? 'Unspecified',
                    'mps' => $mps,
                    'attempts' => $topicRecords->count(),
                    'status' => $mps >= 75 ? 'mastered' : 'weak',
                ];
            })
            ->values();

        $weakCompetencies = $competencyPerformance
            ->where('status', 'weak')
            ->sortBy('mps')
            ->take(8)
            ->values();
        $masteredCompetencies = $competencyPerformance
            ->where('status', 'mastered')
            ->sortByDesc('mps')
            ->take(8)
            ->values();

        $quarterly = $records
            ->groupBy(function ($record): string {
                if (! $record->attempted_at) {
                    return 'Unknown';
                }

                $date = Carbon::parse($record->attempted_at);
                $quarter = (int) ceil($date->month / 3);

                return $date->year.'-Q'.$quarter;
            })
            ->map(function (Collection $quarterRecords, string $period): array {
                return [
                    'period' => $period,
                    'mps' => round((float) ($quarterRecords->avg('accuracy') ?? 0), 2),
                    'attempts' => $quarterRecords->count(),
                    'learners' => $quarterRecords->pluck('student_id')->unique()->count(),
                ];
            })
            ->sortBy('period')
            ->values();

        [$weekStart, $weekEnd] = $this->weekWindow();
        $summativeComplianceSections = ScoreRecord::query()
            ->whereBetween('attempted_at', [$weekStart, $weekEnd])
            ->whereHas('activity', fn (Builder $builder): Builder => $builder->where('instructional_phase', ActivityPhase::SUMMATIVE->value))
            ->distinct('section_id')
            ->count('section_id');
        $weeklySummativeCompliance = $totalSections > 0
            ? round(($summativeComplianceSections / $totalSections) * 100, 2)
            : 0.0;

        return [
            'overview' => [
                'total_students' => $totalStudents,
                'total_teachers' => $totalTeachers,
                'total_sections' => $totalSections,
                'overall_mps' => $overallMps,
                'weekly_summative_compliance' => $weeklySummativeCompliance,
            ],
            'grade_distribution' => $gradeDistribution,
            'class_performance' => $classPerformance,
            'subject_performance' => $subjectPerformance,
            'teacher_summaries' => $teacherSummaries,
            'weak_competencies' => $weakCompetencies,
            'mastered_competencies' => $masteredCompetencies,
            'quarterly' => $quarterly,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{0: array<int, string>, 1: Collection<int, array<int, mixed>>, 2: string}
     */
    public function reportDataset(string $scope, array $filters = []): array
    {
        $dashboard = $this->dashboard($filters);

        return match ($scope) {
            'subject' => [
                ['Subject', 'MPS', 'Attempts', 'Learners'],
                collect($dashboard['subject_performance'])->map(fn (array $row): array => [
                    $row['subject'],
                    $row['mps'],
                    $row['attempts'],
                    $row['learners'],
                ]),
                'subject-performance',
            ],
            'class' => [
                ['Class', 'Grade', 'MPS', 'Attainment %', 'Attempts', 'Learners'],
                collect($dashboard['class_performance'])->map(fn (array $row): array => [
                    $row['section'],
                    $row['grade'],
                    $row['mps'],
                    $row['attainment'],
                    $row['attempts'],
                    $row['learners'],
                ]),
                'class-performance',
            ],
            'teacher' => [
                ['Teacher', 'MPS', 'Attempts', 'Learners', 'Sections'],
                collect($dashboard['teacher_summaries'])->map(fn (array $row): array => [
                    $row['teacher'],
                    $row['mps'],
                    $row['attempts'],
                    $row['learners'],
                    implode('; ', $row['sections']),
                ]),
                'teacher-summary',
            ],
            default => [
                ['Quarter', 'MPS', 'Attempts', 'Learners'],
                collect($dashboard['quarterly'])->map(fn (array $row): array => [
                    $row['period'],
                    $row['mps'],
                    $row['attempts'],
                    $row['learners'],
                ]),
                'quarterly-performance',
            ],
        };
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return Builder<ScoreRecord>
     */
    protected function filteredRecordsQuery(array $filters): Builder
    {
        $query = ScoreRecord::query();

        if (! empty($filters['date_from'])) {
            $query->whereDate('attempted_at', '>=', Carbon::parse((string) $filters['date_from']));
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('attempted_at', '<=', Carbon::parse((string) $filters['date_to']));
        }

        if (! empty($filters['section_id'])) {
            $query->where('section_id', (int) $filters['section_id']);
        }

        if (! empty($filters['teacher_id'])) {
            $teacherId = (int) $filters['teacher_id'];
            $query->whereHas('section.teachers', fn (Builder $builder): Builder => $builder->where('users.id', $teacherId));
        }

        if (! empty($filters['subject'])) {
            $subject = trim((string) $filters['subject']);
            $query->whereHas('topic.lesson', fn (Builder $builder): Builder => $builder->where('subject', $subject));
        }

        if (! empty($filters['grade_keyword'])) {
            $gradeKeyword = trim((string) $filters['grade_keyword']);
            $query->whereHas('section', fn (Builder $builder): Builder => $builder->where('name', 'like', '%'.$gradeKeyword.'%'));
        }

        return $query;
    }

    /**
     * @param  Collection<int, float>  $scores
     * @return array<string, int>
     */
    protected function distribution(Collection $scores): array
    {
        $distribution = [
            '90-100' => 0,
            '80-89' => 0,
            '75-79' => 0,
            '60-74' => 0,
            '0-59' => 0,
        ];

        foreach ($scores as $score) {
            if ($score >= 90) {
                $distribution['90-100']++;
                continue;
            }
            if ($score >= 80) {
                $distribution['80-89']++;
                continue;
            }
            if ($score >= 75) {
                $distribution['75-79']++;
                continue;
            }
            if ($score >= 60) {
                $distribution['60-74']++;
                continue;
            }
            $distribution['0-59']++;
        }

        return $distribution;
    }

    protected function gradeFromSection(?string $sectionName): string
    {
        $name = strtolower((string) $sectionName);
        if (preg_match('/grade\\s*\\d+/i', $name, $matches) === 1) {
            return strtoupper($matches[0]);
        }

        return 'UNSPECIFIED';
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    protected function weekWindow(): array
    {
        $start = now()->startOfWeek()->startOfDay();
        $end = $start->copy()->endOfWeek();

        return [$start, $end];
    }
}
