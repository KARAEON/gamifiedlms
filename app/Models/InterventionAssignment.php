<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InterventionAssignment extends Model
{
    /** @use HasFactory<\Database\Factories\InterventionAssignmentFactory> */
    use HasFactory;

    protected $fillable = [
        'mastery_cycle_id',
        'teacher_id',
        'section_id',
        'topic_id',
        'student_id',
        'intervention_type',
        'recommended_action',
        'reason',
        'status',
        'assigned_at',
        'due_at',
        'completed_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'due_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function masteryCycle(): BelongsTo
    {
        return $this->belongsTo(MasteryCycle::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}
