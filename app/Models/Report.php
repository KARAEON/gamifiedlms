<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Report extends Model
{
    /** @use HasFactory<\Database\Factories\ReportFactory> */
    use HasFactory;

    protected $fillable = [
        'generated_by',
        'report_type',
        'student_id',
        'section_id',
        'title',
        'filters',
        'file_path',
        'remarks',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'filters' => 'array',
            'generated_at' => 'datetime',
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(ReportDelivery::class);
    }

    public function latestSchoolHeadDelivery(): HasOne
    {
        return $this->hasOne(ReportDelivery::class)
            ->where('target_role', 'admin')
            ->latestOfMany('submitted_at');
    }
}
