<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'section_id',
        'subject',
        'quarter',
        'performance_task_items',
        'performance_task_hps_items',
        'performance_task_score',
        'performance_task_hps',
        'quarterly_assessment_score',
        'quarterly_assessment_hps',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'quarter' => 'integer',
            'performance_task_items' => 'array',
            'performance_task_hps_items' => 'array',
            'performance_task_score' => 'float',
            'performance_task_hps' => 'float',
            'quarterly_assessment_score' => 'float',
            'quarterly_assessment_hps' => 'float',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}