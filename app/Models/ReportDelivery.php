<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportDelivery extends Model
{
    /** @use HasFactory<\Database\Factories\ReportDeliveryFactory> */
    use HasFactory;

    protected $fillable = [
        'report_id',
        'submitted_by',
        'target_role',
        'status',
        'acknowledged_by',
        'submitted_at',
        'acknowledged_at',
        'teacher_note',
        'admin_note',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'acknowledged_at' => 'datetime',
        ];
    }

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function acknowledger(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledged_by');
    }
}
