<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Section extends Model
{
    /** @use HasFactory<\Database\Factories\SectionFactory> */
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function students(): HasMany
    {
        return $this->hasMany(StudentProfile::class);
    }

    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'section_teacher', 'section_id', 'teacher_id')->withTimestamps();
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class);
    }

    public function scoreRecords(): HasMany
    {
        return $this->hasMany(ScoreRecord::class);
    }

    public function phaserGameResults(): HasMany
    {
        return $this->hasMany(PhaserGameResult::class);
    }

    public function phaserLessonLocks(): HasMany
    {
        return $this->hasMany(SectionPhaserLessonLock::class);
    }

    public function phaserMajorLocks(): HasMany
    {
        return $this->hasMany(SectionPhaserMajorLock::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class);
    }

    public function masteryCycles(): HasMany
    {
        return $this->hasMany(MasteryCycle::class);
    }

    public function interventions(): HasMany
    {
        return $this->hasMany(InterventionAssignment::class);
    }

    public function gradingPolicies(): HasMany
    {
        return $this->hasMany(GradingPolicy::class);
    }
}
