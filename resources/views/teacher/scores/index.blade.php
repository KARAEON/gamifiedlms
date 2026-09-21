<x-teacher-layout title="Game Scores">
    <div class="space-y-6">
        <section class="panel p-6">
            <h1 class="text-2xl font-semibold text-slate-900">Student Game Scores</h1>
            <p class="mt-1 text-sm text-slate-600">Monitor activity results, compare score quality, and review recent attempts across learners.</p>
        </section>

        <section class="filter-panel">
            <form method="GET" action="{{ route('teacher.scores.index') }}" class="grid gap-3 md:grid-cols-2 xl:grid-cols-8">
                <div class="xl:col-span-2">
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
                    <input
                        type="text"
                        name="search"
                        value="{{ $filters['search'] }}"
                        class="input-field"
                        placeholder="Student, game, or topic"
                    >
                </div>

                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Source</label>
                    <select name="source" class="input-field">
                        <option value="all" @selected($filters['source'] === 'all')>All sources</option>
                        <option value="activities" @selected($filters['source'] === 'activities')>Activities</option>
                        <option value="phaser" @selected($filters['source'] === 'phaser')>Phaser</option>
                    </select>
                </div>

                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Section</label>
                    <select name="section_id" class="input-field">
                        <option value="">All sections</option>
                        @foreach ($sections as $section)
                            <option value="{{ $section->id }}" @selected((string) $filters['section_id'] === (string) $section->id)>
                                {{ $section->name }}
                            </option>
                        @endforeach
                    </select>
                </div>

                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Student</label>
                    <select name="student_id" class="input-field">
                        <option value="">All students</option>
                        @foreach ($students as $student)
                            <option value="{{ $student->id }}" @selected((string) $filters['student_id'] === (string) $student->id)>
                                {{ $student->name }}
                            </option>
                        @endforeach
                    </select>
                </div>

                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Workflow Phase</label>
                    <select name="instructional_phase" class="input-field">
                        <option value="">All phases</option>
                        @foreach ($activityPhaseLabels as $phase => $label)
                            <option value="{{ $phase }}" @selected((string) $filters['instructional_phase'] === $phase)>
                                {{ $label }}
                            </option>
                        @endforeach
                    </select>
                </div>

                @if ($filters['source'] !== 'activities')
                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Result Type</label>
                        <select name="result_type" class="input-field">
                            <option value="">All Phaser results</option>
                            <option value="minigame" @selected($filters['result_type'] === 'minigame')>Minigame</option>
                            <option value="assessment" @selected($filters['result_type'] === 'assessment')>Assessment</option>
                        </select>
                    </div>
                @endif

                @if ($filters['source'] !== 'phaser')
                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Game Type</label>
                        <select name="activity_type" class="input-field">
                            <option value="">All types</option>
                            @foreach ($activityTypeLabels as $activityType => $label)
                                <option value="{{ $activityType }}" @selected((string) $filters['activity_type'] === $activityType)>
                                    {{ $label }}
                                </option>
                            @endforeach
                        </select>
                    </div>

                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Activity</label>
                        <select name="activity_id" class="input-field">
                            <option value="">All activities</option>
                            @foreach ($activities as $activity)
                                <option value="{{ $activity->id }}" @selected((string) $filters['activity_id'] === (string) $activity->id)>
                                    {{ $activity->title }}
                                </option>
                            @endforeach
                        </select>
                    </div>
                @endif

                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">From</label>
                    <input type="date" name="date_from" value="{{ $filters['date_from'] }}" class="input-field">
                </div>

                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">To</label>
                    <input type="date" name="date_to" value="{{ $filters['date_to'] }}" class="input-field">
                </div>

                <div class="flex items-end gap-2 xl:col-span-2">
                    <button type="submit" class="btn-primary w-full sm:w-auto">Apply Filters</button>
                    <a href="{{ route('teacher.scores.index') }}" class="btn-secondary w-full text-center sm:w-auto">Reset</a>
                </div>
            </form>
        </section>

        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article class="metric-card">
                <p class="metric-label">Total Attempts</p>
                <p class="metric-value">{{ number_format($summary['total_attempts']) }}</p>
                <p class="mt-1 text-xs text-slate-500">Filtered game submissions</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Average Score</p>
                <p class="metric-value">{{ number_format($summary['average_score_percent'], 1) }}%</p>
                <p class="mt-1 text-xs text-slate-500">Score ratio from points earned</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Average Accuracy</p>
                <p class="metric-value">{{ number_format($summary['average_accuracy'], 1) }}%</p>
                <p class="mt-1 text-xs text-slate-500">Correct response quality</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Best Accuracy</p>
                <p class="metric-value">{{ number_format($summary['best_accuracy'], 1) }}%</p>
                <p class="mt-1 text-xs text-slate-500">Highest result in filter scope</p>
            </article>
        </section>

        <section class="panel p-5">
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th scope="col">Date</th>
                            <th scope="col">Student</th>
                            <th scope="col">Section</th>
                            <th scope="col">Game</th>
                            <th scope="col">Phase</th>
                            <th scope="col">Topic</th>
                            <th scope="col">Score</th>
                            <th scope="col">Accuracy</th>
                            <th scope="col">Attempt #</th>
                            <th scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($records as $record)
                            <tr>
                                <td class="py-3">{{ $record['date'] }}</td>
                                <td class="py-3">
                                    <a href="{{ route('teacher.students.show', $record['student_id']) }}" class="font-semibold text-brand-700 hover:text-brand-700">
                                        {{ $record['student_name'] }}
                                    </a>
                                    <p class="text-xs text-slate-500">{{ $record['student_email'] }}</p>
                                </td>
                                <td class="py-3">{{ $record['section_name'] }}</td>
                                <td class="py-3">
                                    <p class="font-medium text-slate-900">{{ $record['game_title'] }}</p>
                                    <p class="text-xs text-slate-500">{{ $record['game_meta'] }}</p>
                                </td>
                                <td class="py-3">{{ $record['phase_label'] }}</td>
                                <td class="py-3">
                                    <p class="text-slate-700">{{ $record['topic_title'] }}</p>
                                    <p class="text-xs text-slate-500">{{ $record['lesson_title'] }}</p>
                                </td>
                                <td class="py-3">{{ number_format((float) $record['score'], 1) }}/{{ number_format((float) $record['max_score'], 1) }}</td>
                                <td class="py-3">{{ number_format((float) $record['accuracy'], 1) }}%</td>
                                <td class="py-3">{{ $record['attempt_number'] }}</td>
                                <td class="py-3">
                                    <span class="badge {{ $record['status_tone'] === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ($record['status_tone'] === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-700') }}">
                                        {{ $record['status'] }}
                                    </span>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="10" class="py-6">
                                    <div class="empty-state">No game scores found for the current filters.</div>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <div class="mt-4">
                {{ $records->links() }}
            </div>
        </section>
    </div>
</x-teacher-layout>
