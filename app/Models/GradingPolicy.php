<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradingPolicy extends Model
{
    /** @use HasFactory<\Database\Factories\GradingPolicyFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'scope',
        'section_id',
        'subject',
        'effective_from',
        'effective_to',
        'mastery_threshold',
        'attainment_threshold',
        'gamified_weight',
        'formative_weight',
        'summative_weight',
        'weekly_summative_required',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'effective_from' => 'date',
            'effective_to' => 'date',
            'weekly_summative_required' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
