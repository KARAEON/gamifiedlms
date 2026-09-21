<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhaserGameResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'section_id',
        'lesson_key',
        'lesson_title',
        'game_key',
        'entry_type',
        'phase',
        'game_title',
        'topic_title',
        'submission_uuid',
        'attempt_number',
        'score',
        'max_score',
        'accuracy',
        'result_status',
        'payload',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'completed_at' => 'datetime',
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
}
