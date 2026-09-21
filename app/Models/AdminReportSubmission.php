<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminReportSubmission extends Model
{
    /** @use HasFactory<\Database\Factories\AdminReportSubmissionFactory> */
    use HasFactory;

    protected $fillable = [
        'submitted_by',
        'report_scope',
        'scope_reference',
        'date_from',
        'date_to',
        'destination',
        'status',
        'submitted_at',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'date_from' => 'date',
            'date_to' => 'date',
            'submitted_at' => 'datetime',
        ];
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }
}
