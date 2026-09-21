<?php

namespace App\Models;

use App\Enums\ActivityPhase;
use App\Enums\ActivityType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Activity extends Model
{
    /** @use HasFactory<\Database\Factories\ActivityFactory> */
    use HasFactory;

    protected $fillable = [
        'topic_id',
        'title',
        'activity_type',
        'instructional_phase',
        'instructions',
        'settings',
        'max_score',
        'allow_retry',
        'time_limit_seconds',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'activity_type' => ActivityType::class,
            'instructional_phase' => ActivityPhase::class,
            'allow_retry' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('sort_order');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class);
    }

    public function scoreRecords(): HasMany
    {
        return $this->hasMany(ScoreRecord::class);
    }
}
