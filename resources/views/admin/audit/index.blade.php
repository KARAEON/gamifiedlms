<x-app-layout title="Audit Trail">
    <div class="space-y-6">
        <x-staff.page-heading title="System Audit Trail" description="Trace high-impact actions for governance, compliance, and incident review." eyebrow="School governance"></x-staff.page-heading>

        <section class="filter-panel">
            <form method="GET" action="{{ route('admin.audit.index') }}" class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <input type="text" name="action" class="input-field" value="{{ $filters['action'] }}" placeholder="Action contains...">
                <select name="actor_id" class="input-field">
                    <option value="">All actors</option>
                    @foreach ($actors as $actor)
                        <option value="{{ $actor->id }}" @selected((string) $filters['actor_id'] === (string) $actor->id)>{{ $actor->name }}</option>
                    @endforeach
                </select>
                <input type="text" name="entity_type" class="input-field" value="{{ $filters['entity_type'] }}" placeholder="Entity type contains...">
                <div class="flex gap-2">
                    <button class="btn-primary">Apply</button>
                    <a href="{{ route('admin.audit.index') }}" class="btn-secondary">Reset</a>
                </div>
            </form>
        </section>

        <section class="panel p-5">
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Actor</th>
                            <th>Action</th>
                            <th>Entity</th>
                            <th>Context</th>
                            <th>IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($logs as $log)
                            <tr>
                                <td>{{ optional($log->created_at)->format('M d, Y h:i:s A') }}</td>
                                <td>
                                    {{ $log->actor?->name ?? 'System' }}
                                    <p class="text-xs text-slate-500">{{ strtoupper($log->actor_role ?? '-') }}</p>
                                </td>
                                <td>{{ $log->action }}</td>
                                <td>{{ $log->entity_type }}#{{ $log->entity_id ?? '-' }}</td>
                                <td><code>{{ json_encode($log->context ?? []) }}</code></td>
                                <td>{{ $log->ip_address ?? '-' }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="6" class="py-6">
                                    <div class="empty-state">No audit logs found for this filter scope.</div>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            <div class="mt-4">{{ $logs->links() }}</div>
        </section>
    </div>
</x-app-layout>
