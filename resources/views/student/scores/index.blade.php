<x-app-layout title="My Scores">
    <div class="space-y-6">
        <div class="panel p-6">
            <h1 class="text-2xl font-semibold text-slate-900">My Scores</h1>
            <p class="mt-1 text-sm text-slate-600">Track your performance per lesson and activity.</p>
        </div>

        <div class="panel p-5">
            <div class="mb-4 grid gap-4 sm:grid-cols-2">
                <div class="rounded-xl bg-brand-50 p-4 ring-1 ring-brand-100">
                    <p class="text-xs uppercase tracking-wider text-slate-500">Current Page Average</p>
                    <p class="text-2xl font-semibold text-brand-700">{{ number_format($average, 1) }}%</p>
                </div>
                <a href="{{ route('student.progress.index') }}" class="btn-secondary h-fit self-center sm:justify-self-end">View Progress Analytics</a>
            </div>

            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th scope="col">Lesson</th>
                            <th scope="col">Topic</th>
                            <th scope="col">Activity</th>
                            <th scope="col">Score</th>
                            <th scope="col">Accuracy</th>
                            <th scope="col">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($records as $record)
                            <tr>
                                <td class="py-3">{{ $record->lesson?->title }}</td>
                                <td class="py-3">{{ $record->topic?->title }}</td>
                                <td class="py-3">{{ $record->activity?->title }}</td>
                                <td class="py-3">{{ number_format($record->score, 0) }}/{{ number_format($record->max_score, 0) }}</td>
                                <td class="py-3">{{ number_format($record->accuracy, 1) }}%</td>
                                <td class="py-3">{{ optional($record->attempted_at)->format('M d, Y') }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="6" class="py-6">
                                    <div class="empty-state">No score records yet.</div>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <div class="mt-4">
                {{ $records->links() }}
            </div>
        </div>
    </div>
</x-app-layout>



