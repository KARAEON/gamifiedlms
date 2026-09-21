<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AuditController extends Controller
{
    public function index(Request $request): View
    {
        $filters = [
            'action' => trim((string) $request->query('action', '')),
            'actor_id' => $request->query('actor_id'),
            'entity_type' => trim((string) $request->query('entity_type', '')),
        ];

        $query = AuditLog::query()->with('actor:id,name,email');

        if ($filters['action'] !== '') {
            $query->where('action', 'like', '%'.$filters['action'].'%');
        }
        if (! empty($filters['actor_id'])) {
            $query->where('actor_id', (int) $filters['actor_id']);
        }
        if ($filters['entity_type'] !== '') {
            $query->where('entity_type', 'like', '%'.$filters['entity_type'].'%');
        }

        return view('admin.audit.index', [
            'filters' => $filters,
            'logs' => $query->latest('created_at')->paginate(30)->withQueryString(),
            'actors' => User::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }
}
