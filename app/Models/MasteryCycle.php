<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MasteryCycle extends Model
{
    /** @use HasFactory<\Database\Factories\MasteryCycleFactory> */
    use HasFactory;

    protected $fillable = [
        'teacher_id',
        'section_id',
        'lesson_id',
        'topic_id',
        'class_size',
        'students_mastered',
        'class_attainment',
        'mastery_threshold',
        'attainment_threshold',
        'decision',
        'requires_reteach',
        'reteach_attempts',
        'reteach_strategy',
        'reteach_notes',
        'reteach_completed_at',
        'weekly_summative_attempts',
        'weekly_summative_mps',
        'evaluated_at',
    ];

    protected function casts(): array
    {
        return [
            'requires_reteach' => 'boolean',
            'reteach_completed_at' => 'datetime',
            'evaluated_at' => 'datetime',
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(InterventionAssignment::class);
    }
}
