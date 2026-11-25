<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\ScoreRecord;
use App\Models\PhaserGameResult;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AiInsightService
{
    private const FAILING_THRESHOLD = 74.0;

    /**
     * @var array<int, string>
     */
    private const REQUIRED_OUTPUT_KEYS = [
        'class_analysis',
        'at_risk_group_strategy',
        'critical_student_focus',
    ];

    /**
     * @param  array<string, mixed>  $filters
     * @return array{
     *     analysis: array<string, string>,
     *     roster: array<int, array<string, mixed>>,
     *     source: string,
     *     warning: string|null,
     *     window: array{date_from: string, date_to: string}
     * }
     */
    public function generateForTeacher(User $teacher, array $filters = []): array
    {
        [$dateFrom, $dateTo] = $this->resolveDateWindow($filters);

        $records = $this->recordsQuery($teacher, $dateFrom, $dateTo)->get()
            ->concat($this->gameRecords($teacher, $dateFrom, $dateTo));
        $roster = $this->buildRoster($records);
        $topicInsights = $this->buildTopicInsights($records);
        $context = $this->buildContext($teacher, $roster, $topicInsights, $dateFrom, $dateTo);

        $finalData = $this->buildFallbackAnalysis($context);
        $source = 'fallback';
        $warning = null;

        if ($roster->isNotEmpty()) {
            foreach (['ollama', 'groq'] as $provider) {
                if ($provider === 'ollama' && ! config('services.ollama.enabled', true)) {
                    continue;
                }
                if ($provider === 'groq' && ! config('services.groq.key')) {
                    continue;
                }
                try {
                    $finalData = $provider === 'ollama'
                        ? $this->callOllamaForAnalysis($context)
                        : $this->callGroqForAnalysis($context);
                    $source = $provider;
                    break;
                } catch (\Throwable $exception) {
                    // Continue to the next provider; never expose credentials or response bodies.
                }
            }
            if ($source === 'fallback') {
                $warning = 'AI is unavailable. Showing recommendations calculated from recorded scores.';
            }
        }

        return [
            'analysis' => $finalData,
            'roster' => $roster->values()->all(),
            'source' => $source,
            'warning' => $warning,
            'window' => [
                'date_from' => $dateFrom->toDateString(),
                'date_to' => $dateTo->toDateString(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{0: Carbon, 1: Carbon}
     */
    private function resolveDateWindow(array $filters): array
    {
        $dateTo = ! empty($filters['date_to']) ? Carbon::parse((string) $filters['date_to']) : now();
        $dateFrom = ! empty($filters['date_from']) ? Carbon::parse((string) $filters['date_from']) : (clone $dateTo)->subDays(30);

        if ($dateFrom->greaterThan($dateTo)) {
            [$dateFrom, $dateTo] = [$dateTo, $dateFrom];
        }

        return [$dateFrom->startOfDay(), $dateTo->endOfDay()];
    }

    private function gameRecords(User $teacher, Carbon $dateFrom, Carbon $dateTo): Collection
    {
        $sectionIds = $teacher->handledSections()->pluck('sections.id');
        return PhaserGameResult::query()->with(['student.studentProfile.section', 'section'])
            ->where('entry_type', 'assessment')->where('phase', 'formative')
            ->whereHas('student', fn (Builder $query) => $query->where('role', UserRole::STUDENT->value)->where('is_active', true))
            ->whereBetween('completed_at', [$dateFrom, $dateTo])
            ->whereIn('section_id', $sectionIds)
            ->get()->map(function (PhaserGameResult $result): ScoreRecord {
                $record = new ScoreRecord([
                    'student_id' => $result->student_id, 'section_id' => $result->section_id,
                    'topic_id' => 'game:'.$result->lesson_key, 'accuracy' => $result->accuracy,
                    'score' => $result->score, 'max_score' => $result->max_score,
                    'attempted_at' => $result->completed_at,
                ]);
                $topic = new Topic(['title' => $result->topic_title]);
                $topic->setRelation('lesson', new Lesson(['title' => $result->lesson_title]));
                return $record->setRelation('student', $result->student)
                    ->setRelation('section', $result->section)->setRelation('topic', $topic);
            });
    }

    /**
     * @return Builder<ScoreRecord>
     */
    private function recordsQuery(User $teacher, Carbon $dateFrom, Carbon $dateTo): Builder
    {
        $allowedSectionIds = $teacher->handledSections()->pluck('sections.id');

        $query = ScoreRecord::query()
            ->with(['student.studentProfile.section', 'topic.lesson', 'section'])
            ->whereHas('student', function (Builder $builder): void {
                $builder
                    ->where('role', UserRole::STUDENT->value)
                    ->where('is_active', true);
            })
            ->whereDate('attempted_at', '>=', $dateFrom->toDateString())
            ->whereDate('attempted_at', '<=', $dateTo->toDateString());

        if ($allowedSectionIds->isNotEmpty()) {
            $query->where(function (Builder $builder) use ($allowedSectionIds): void {
                $builder->whereIn('section_id', $allowedSectionIds)
                    ->orWhereHas('student.studentProfile', fn (Builder $studentBuilder): Builder => $studentBuilder->whereIn('section_id', $allowedSectionIds));
            });
        } else {
            $query->whereRaw('1 = 0');
        }

        return $query;
    }

    /**
     * @param  Collection<int, ScoreRecord>  $records
     * @return Collection<int, array<string, mixed>>
     */
    private function buildRoster(Collection $records): Collection
    {
        return $records
            ->groupBy('student_id')
            ->map(function (Collection $studentRecords): array {
                /** @var ScoreRecord|null $sample */
                $sample = $studentRecords->sortByDesc('attempted_at')->first();
                $averageAccuracy = round((float) $studentRecords->avg('accuracy'), 1);

                $failingTopics = $studentRecords
                    ->groupBy('topic_id')
                    ->map(function (Collection $topicRecords): ?string {
                        $topicAverage = (float) $topicRecords->avg('accuracy');
                        /** @var ScoreRecord|null $topicSample */
                        $topicSample = $topicRecords->first();

                        return $topicAverage <= self::FAILING_THRESHOLD ? $topicSample?->topic?->title : null;
                    })
                    ->filter()
                    ->values()
                    ->all();

                return [
                    'student_id' => $sample?->student_id,
                    'student_name' => $sample?->student?->name ?? 'Unknown Student',
                    'section' => $sample?->section?->name ?? $sample?->student?->studentProfile?->section?->name ?? 'Unassigned',
                    'average_accuracy' => $averageAccuracy,
                    'attempts' => $studentRecords->count(),
                    'is_at_risk' => $averageAccuracy <= self::FAILING_THRESHOLD,
                    'risk_level' => $averageAccuracy <= self::FAILING_THRESHOLD
                        ? 'high'
                        : ($averageAccuracy < 82 ? 'moderate' : 'low'),
                    'failing_topics' => $failingTopics,
                ];
            })
            ->sortBy('average_accuracy')
            ->values();
    }

    /**
     * @param  Collection<int, ScoreRecord>  $records
     * @return Collection<int, array<string, mixed>>
     */
    private function buildTopicInsights(Collection $records): Collection
    {
        return $records
            ->groupBy('topic_id')
            ->map(function (Collection $topicRecords): array {
                /** @var ScoreRecord|null $sample */
                $sample = $topicRecords->first();

                return [
                    'topic' => $sample?->topic?->title ?? 'Unknown Topic',
                    'lesson' => $sample?->topic?->lesson?->title ?? 'Unknown Lesson',
                    'avg_accuracy' => round((float) $topicRecords->avg('accuracy'), 1),
                    'attempts' => $topicRecords->count(),
                ];
            })
            ->sortByDesc('attempts')
            ->values();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $roster
     * @param  Collection<int, array<string, mixed>>  $topicInsights
     * @return array<string, mixed>
     */
    private function buildContext(
        User $teacher,
        Collection $roster,
        Collection $topicInsights,
        Carbon $dateFrom,
        Carbon $dateTo
    ): array {
        $classAverage = round((float) ($roster->avg('average_accuracy') ?? 0), 1);
        $bestTopic = $topicInsights->sortByDesc('avg_accuracy')->first();
        $weakestTopic = $topicInsights->sortBy('avg_accuracy')->first();
        $criticalStudent = $roster->first();

        $className = $teacher->handledSections()
            ->orderBy('name')
            ->pluck('name')
            ->join(', ');

        return [
            'Class_Name' => $className !== '' ? $className : 'Teacher Workspace',
            'Date_From' => $dateFrom->toDateString(),
            'Date_To' => $dateTo->toDateString(),
            'Class_Size' => $roster->count(),
            'Average_Accuracy' => $classAverage,
            'Highest_Performing_Topic' => $bestTopic['topic'] ?? 'No topic data',
            'Highest_Performing_Topic_Average' => $bestTopic['avg_accuracy'] ?? 0,
            'Lowest_Performing_Topic' => $weakestTopic['topic'] ?? 'No topic data',
            'Lowest_Performing_Topic_Average' => $weakestTopic['avg_accuracy'] ?? 0,
            'Total_At_Risk_Count' => $roster->where('is_at_risk', true)->count(),
            'Critical_Student_ID' => $criticalStudent['student_name'] ?? 'No student data',
            'Critical_Student_Average' => $criticalStudent['average_accuracy'] ?? 0,
            'Critical_Student_Failing_Topics' => $criticalStudent['failing_topics'] ?? [],
            'Critical_Student_Is_At_Risk' => (bool) ($criticalStudent['is_at_risk'] ?? false),
            'Total_Attempts' => (int) $roster->sum('attempts'),
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, string>
     */
    private function buildFallbackAnalysis(array $context): array
    {
        if ((int) $context['Class_Size'] === 0) {
            return [
                'class_analysis' => 'No score records were found for the selected period. The system cannot compute reliable class patterns without recent attempts. Capture fresh activity submissions and rerun AI analysis.',
                'at_risk_group_strategy' => 'No students are currently flagged because no recent data is available. Start with one baseline activity per section, then launch a targeted small-group plan from the new results.',
                'critical_student_focus' => 'No critical learner can be identified yet due to missing records. After baseline submissions, prioritize 1-on-1 coaching for the learner with the lowest average and most repeated weak topics.',
            ];
        }

        $bestTopic = (string) $context['Highest_Performing_Topic'];
        $bestAvg = (float) $context['Highest_Performing_Topic_Average'];
        $weakTopic = (string) $context['Lowest_Performing_Topic'];
        $weakAvg = (float) $context['Lowest_Performing_Topic_Average'];
        $atRiskCount = (int) $context['Total_At_Risk_Count'];
        $criticalStudent = (string) $context['Critical_Student_ID'];
        $criticalAvg = (float) $context['Critical_Student_Average'];
        $criticalAtRisk = (bool) $context['Critical_Student_Is_At_Risk'];
        /** @var array<int, string> $criticalFailingTopics */
        $criticalFailingTopics = is_array($context['Critical_Student_Failing_Topics']) ? $context['Critical_Student_Failing_Topics'] : [];

        $classAnalysis = sprintf(
            'Class performance is strongest in %s at %.1f%%, while %s is currently the weakest at %.1f%%. This pattern indicates learners need stronger scaffolding and guided retrieval in the low-performing topic cluster. A class-wide fix is to add short explicit modeling and immediate corrective feedback before independent tasks.',
            $bestTopic,
            $bestAvg,
            $weakTopic,
            $weakAvg
        );

        $atRiskGroupStrategy = $atRiskCount > 0
            ? sprintf(
                'There are %d students currently flagged at risk based on low average accuracy. Run a small-group intervention focused on %s using chunked instruction, guided examples, and quick mastery checks.',
                $atRiskCount,
                $weakTopic
            )
            : 'No students are currently marked at risk in this date range. Maintain enrichment cycles while continuing weekly monitoring to catch early decline signals.';

        $criticalStudentFocus = $criticalAtRisk
            ? sprintf(
                '%s has the most urgent support need with an average of %.1f%% and weaknesses in %s. Provide 1-on-1 intervention with targeted reteaching and short corrective practice loops after each attempt.',
                $criticalStudent,
                $criticalAvg,
                $this->joinTopics($criticalFailingTopics)
            )
            : sprintf(
                '%s has the lowest class average at %.1f%% but is currently above the risk threshold. Provide light 1-on-1 coaching to strengthen consistency and prevent regression into at-risk status.',
                $criticalStudent,
                $criticalAvg
            );

        return [
            'class_analysis' => $classAnalysis,
            'at_risk_group_strategy' => $atRiskGroupStrategy,
            'critical_student_focus' => $criticalStudentFocus,
        ];
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, string>
     */
    private function callOllamaForAnalysis(array $context): array
    {
        $url = (string) config('services.ollama.url');
        $model = (string) config('services.ollama.model');
        $timeout = (int) config('services.ollama.timeout', 45);

        if ($url === '' || $model === '') {
            throw new RuntimeException('Ollama configuration is missing.');
        }

        $response = Http::connectTimeout(3)->timeout($timeout)->acceptJson()->post($url, [
            'model' => $model,
            'prompt' => $this->buildPrompt($context),
            'stream' => false,
            'format' => 'json',
            'options' => [
                'temperature' => 0.1,
            ],
        ]);

        if (! $response->successful()) {
            throw new RuntimeException('Ollama request failed with status '.$response->status().'.');
        }

        $rawText = (string) $response->json('response', '');
        $parsed = $this->parseJsonObjectFromText($rawText);

        return $this->sanitizeModelOutput($parsed);
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function callGroqForAnalysis(array $context): array
    {
        $studentName = (string) $context['Critical_Student_ID'];
        $context['Critical_Student_ID'] = 'Priority learner';
        $context['Class_Name'] = 'Assigned class';
        $response = Http::withToken((string) config('services.groq.key'))
            ->connectTimeout(3)->timeout((int) config('services.groq.timeout', 18))
            ->acceptJson()->post((string) config('services.groq.url'), [
                'model' => config('services.groq.model'),
                'messages' => [['role' => 'user', 'content' => $this->buildPrompt($context)]],
                'temperature' => 0.1,
                'max_completion_tokens' => 1800,
                'response_format' => ['type' => 'json_object'],
            ]);
        if (! $response->successful()) {
            throw new RuntimeException('Hosted AI request failed.');
        }
        $analysis = $this->sanitizeModelOutput($this->parseJsonObjectFromText(
            (string) $response->json('choices.0.message.content', '')
        ));
        return array_map(fn (string $value) => str_ireplace('Priority learner', $studentName, $value), $analysis);
    }

    private function buildPrompt(array $context): string
    {
        $systemPrompt = <<<'PROMPT'
You are a Grade 6 instructional data analyst. Use only the supplied evidence; do not invent scores, diagnoses, or learning history.

Return only one valid JSON object with exactly these keys:
- "class_analysis"
- "at_risk_group_strategy"
- "critical_student_focus"

Rules:
1) Each value must be plain string text (no arrays, no markdown, no extra keys).
2) Keep each value as one paragraph.
3) class_analysis must be exactly 3 sentences.
4) at_risk_group_strategy must be exactly 2 sentences.
5) critical_student_focus must be exactly 2 sentences.
6) Use a professional, teacher-facing tone focused on interventions.

If Total_At_Risk_Count is 0, explicitly state that no students are currently at risk and suggest enrichment plus monitoring.
If Critical_Student_Is_At_Risk is true, reference Critical_Student_Failing_Topics directly.
PROMPT;

        return $systemPrompt."\n\nPre-Processed Data:\n".json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /**
     * @return array<string, mixed>
     */
    private function parseJsonObjectFromText(string $text): array
    {
        $cleaned = trim($text);
        if ($cleaned === '') {
            throw new RuntimeException('Model response was empty.');
        }

        $parsed = json_decode($cleaned, true);
        if (is_array($parsed)) {
            return $parsed;
        }

        $start = strpos($cleaned, '{');
        $end = strrpos($cleaned, '}');
        if ($start === false || $end === false || $start >= $end) {
            throw new RuntimeException('Could not find a valid JSON object in model response.');
        }

        $possibleJson = substr($cleaned, $start, ($end - $start) + 1);
        $parsed = json_decode($possibleJson, true);
        if (! is_array($parsed)) {
            throw new RuntimeException('Model response was not a valid JSON object.');
        }

        return $parsed;
    }

    /**
     * @param  array<string, mixed>  $parsed
     * @return array<string, string>
     */
    private function sanitizeModelOutput(array $parsed): array
    {
        $sanitized = [];

        foreach (self::REQUIRED_OUTPUT_KEYS as $key) {
            $value = $parsed[$key] ?? null;
            if (! is_string($value)) {
                throw new RuntimeException('Missing or invalid model key: '.$key);
            }

            $normalized = trim(preg_replace('/\s+/', ' ', $value) ?? '');
            if ($normalized === '') {
                throw new RuntimeException('Empty model value for key: '.$key);
            }

            $sanitized[$key] = $normalized;
        }

        return $sanitized;
    }

    /**
     * @param  array<int, string>  $topics
     */
    private function joinTopics(array $topics): string
    {
        if (count($topics) === 0) {
            return 'no specific topic group';
        }

        if (count($topics) === 1) {
            return $topics[0];
        }

        if (count($topics) === 2) {
            return $topics[0].' and '.$topics[1];
        }

        $last = array_pop($topics);

        return implode(', ', $topics).', and '.$last;
    }
}

