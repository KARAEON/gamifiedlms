<x-app-layout title="Admin Report Preview">
    <div class="space-y-6">
        <section class="panel p-6">
            <h1 class="text-2xl font-semibold text-slate-900">{{ ucfirst($scope) }} Report Preview</h1>
            <p class="mt-1 text-sm text-slate-600">Review before export/submission.</p>
            <div class="mt-3">
                <a href="{{ route('admin.reports.index') }}" class="btn-secondary">Back to Reports</a>
            </div>
        </section>

        <section class="panel p-5">
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            @foreach ($headers as $header)
                                <th>{{ $header }}</th>
                            @endforeach
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($rows as $row)
                            <tr>
                                @foreach ($row as $cell)
                                    <td>{{ $cell }}</td>
                                @endforeach
                            </tr>
                        @empty
                            <tr>
                                <td colspan="{{ count($headers) }}" class="py-6">
                                    <div class="empty-state">No report rows found for selected filters.</div>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</x-app-layout>
