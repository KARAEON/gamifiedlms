<?php

namespace App\Models;

use App\Enums\UserRole;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'role',
        'is_active',
        'theme_preference',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'is_active' => 'boolean',
        ];
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function teacherProfile(): HasOne
    {
        return $this->hasOne(TeacherProfile::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class, 'student_id');
    }

    public function scoreRecords(): HasMany
    {
        return $this->hasMany(ScoreRecord::class, 'student_id');
    }

    public function phaserGameResults(): HasMany
    {
        return $this->hasMany(PhaserGameResult::class, 'student_id');
    }

    public function handledSections(): BelongsToMany
    {
        return $this->belongsToMany(Section::class, 'section_teacher', 'teacher_id', 'section_id')->withTimestamps();
    }

    public function createdLessons(): HasMany
    {
        return $this->hasMany(Lesson::class, 'created_by');
    }

    public function generatedReports(): HasMany
    {
        return $this->hasMany(Report::class, 'generated_by');
    }

    public function masteryCycles(): HasMany
    {
        return $this->hasMany(MasteryCycle::class, 'teacher_id');
    }

    public function interventionAssignments(): HasMany
    {
        return $this->hasMany(InterventionAssignment::class, 'teacher_id');
    }

    public function assignedInterventions(): HasMany
    {
        return $this->hasMany(InterventionAssignment::class, 'student_id');
    }

    public function adminReportSubmissions(): HasMany
    {
        return $this->hasMany(AdminReportSubmission::class, 'submitted_by');
    }

    public function reportDeliveries(): HasMany
    {
        return $this->hasMany(ReportDelivery::class, 'submitted_by');
    }

    public function acknowledgedReportDeliveries(): HasMany
    {
        return $this->hasMany(ReportDelivery::class, 'acknowledged_by');
    }

    public function createdGradingPolicies(): HasMany
    {
        return $this->hasMany(GradingPolicy::class, 'created_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'actor_id');
    }

    protected function initials(): Attribute
    {
        return Attribute::make(
            get: fn (): string => collect(explode(' ', trim($this->name)))
                ->filter()
                ->take(2)
                ->map(fn (string $namePart): string => strtoupper(substr($namePart, 0, 1)))
                ->join('')
        );
    }

    public function isStudent(): bool
    {
        return $this->role === UserRole::STUDENT;
    }

    public function isTeacher(): bool
    {
        return $this->role === UserRole::TEACHER;
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::ADMIN || $this->role === UserRole::SCHOOL_HEAD;
    }
}
