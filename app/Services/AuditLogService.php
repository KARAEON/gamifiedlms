<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class AuditLogService
{
    /**
     * @param  array<string, mixed>  $context
     */
    public function log(
        ?User $actor,
        string $action,
        string $entityType,
        int|string|null $entityId = null,
        array $context = [],
        ?Request $request = null
    ): AuditLog {
        $request = $request ?? request();

        return AuditLog::query()->create([
            'actor_id' => $actor?->id,
            'actor_role' => $actor?->role?->value,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId !== null ? (int) $entityId : null,
            'context' => $context,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'created_at' => now(),
        ]);
    }
}
