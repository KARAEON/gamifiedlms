<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Topic extends Model
{
    /** @use HasFactory<\Database\Factories\TopicFactory> */
    use HasFactory;

    protected $fillable = [
        'lesson_id',
        'title',
        'slug',
        'summary',
        'difficulty_level',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    public function questionBanks(): HasMany
    {
        return $this->hasMany(QuestionBank::class);
    }

    public function scoreRecords(): HasMany
    {
        return $this->hasMany(ScoreRecord::class);
    }

    public function masteryCycles(): HasMany
    {
        return $this->hasMany(MasteryCycle::class);
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(InterventionAssignment::class);
    }
}
