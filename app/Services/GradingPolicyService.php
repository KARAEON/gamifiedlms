<?php

namespace App\Services;

use App\Models\GradingPolicy;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class GradingPolicyService
{
    public const DEFAULT_POLICY = [
        'name' => 'System Default Policy',
        'scope' => 'global',
        'mastery_threshold' => 75.0,
        'attainment_threshold' => 80.0,
        'gamified_weight' => 20,
        'formative_weight' => 40,
        'summative_weight' => 40,
        'weekly_summative_required' => true,
    ];

    /**
     * @return array<string, mixed>
     */
    public function resolve(int $sectionId, ?string $subject = null, ?Carbon $asOf = null): array
    {
        $subject = $subject !== null && trim($subject) !== '' ? trim($subject) : null;
        $date = ($asOf ?? now())->toDateString();

        $sectionPolicy = GradingPolicy::query()
            ->where('is_active', true)
            ->where('scope', 'section')
            ->where('section_id', $sectionId)
            ->when($subject, fn (Builder $builder) => $builder->where(function (Builder $subjectBuilder) use ($subject): void {
                $subjectBuilder->where('subject', $subject)->orWhereNull('subject');
            }))
            ->where(function (Builder $builder) use ($date): void {
                $builder->whereNull('effective_from')->orWhereDate('effective_from', '<=', $date);
            })
            ->where(function (Builder $builder) use ($date): void {
                $builder->whereNull('effective_to')->orWhereDate('effective_to', '>=', $date);
            })
            ->orderByRaw('CASE WHEN subject IS NULL THEN 1 ELSE 0 END')
            ->latest('id')
            ->first();

        if ($sectionPolicy) {
            return $this->normalizePolicy($sectionPolicy->toArray());
        }

        $globalPolicy = GradingPolicy::query()
            ->where('is_active', true)
            ->where('scope', 'global')
            ->when($subject, fn (Builder $builder) => $builder->where(function (Builder $subjectBuilder) use ($subject): void {
                $subjectBuilder->where('subject', $subject)->orWhereNull('subject');
            }))
            ->where(function (Builder $builder) use ($date): void {
                $builder->whereNull('effective_from')->orWhereDate('effective_from', '<=', $date);
            })
            ->where(function (Builder $builder) use ($date): void {
                $builder->whereNull('effective_to')->orWhereDate('effective_to', '>=', $date);
            })
            ->orderByRaw('CASE WHEN subject IS NULL THEN 1 ELSE 0 END')
            ->latest('id')
            ->first();

        if ($globalPolicy) {
            return $this->normalizePolicy($globalPolicy->toArray());
        }

        return self::DEFAULT_POLICY;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function validateWeights(array $payload): void
    {
        $total = (int) $payload['gamified_weight'] + (int) $payload['formative_weight'] + (int) $payload['summative_weight'];

        if ($total !== 100) {
            abort(422, 'Grading weights must total 100.');
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function normalizePolicy(array $payload): array
    {
        return [
            'name' => $payload['name'] ?? self::DEFAULT_POLICY['name'],
            'scope' => $payload['scope'] ?? self::DEFAULT_POLICY['scope'],
            'mastery_threshold' => (float) ($payload['mastery_threshold'] ?? self::DEFAULT_POLICY['mastery_threshold']),
            'attainment_threshold' => (float) ($payload['attainment_threshold'] ?? self::DEFAULT_POLICY['attainment_threshold']),
            'gamified_weight' => (int) ($payload['gamified_weight'] ?? self::DEFAULT_POLICY['gamified_weight']),
            'formative_weight' => (int) ($payload['formative_weight'] ?? self::DEFAULT_POLICY['formative_weight']),
            'summative_weight' => (int) ($payload['summative_weight'] ?? self::DEFAULT_POLICY['summative_weight']),
            'weekly_summative_required' => (bool) ($payload['weekly_summative_required'] ?? self::DEFAULT_POLICY['weekly_summative_required']),
        ];
    }
}
