<x-app-layout :title="$title">
    @push('scripts')
        <style>
            @media print {
                aside,
                header,
                .report-preview-actions {
                    display: none !important;
                }

                body {
                    background: #fff !important;
                }

                main {
                    padding: 0 !important;
                }

                .report-preview-root {
                    margin: 0 !important;
                    padding: 0 !important;
                }

                .report-preview-root .panel,
                .report-preview-root .metric-card {
                    box-shadow: none !important;
                    border: 1px solid #cbd5e1 !important;
                }

                .report-preview-root .table-wrap {
                    border: 1px solid #cbd5e1 !important;
                }

                .report-preview-root .badge {
                    border: 1px solid #cbd5e1 !important;
                }
            }
        </style>
    @endpush

    <div class="report-preview-root space-y-6">
        <section class="panel p-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p class="section-kicker">Report Preview</p>
                    <h1 class="section-title">{{ $title }}</h1>
                    <p class="section-copy">Generated on {{ $generatedAt->format('M d, Y h:i A') }}</p>
                    @if (! empty($filters))
                        <div class="mt-3 flex flex-wrap gap-2">
                            @foreach ($filters as $key => $value)
                                <span class="badge bg-slate-100 text-slate-700 ring-1 ring-slate-200">{{ str_replace('_', ' ', ucfirst($key)) }}: {{ $value }}</span>
                            @endforeach
                        </div>
                    @endif
                </div>
                <div class="report-preview-actions flex flex-wrap gap-2">
                    <button onclick="window.print()" class="btn-secondary">Print View</button>
                    <a href="{{ route('teacher.reports.index') }}" class="btn-primary">Back to Reports</a>
                </div>
            </div>
        </section>

        @if ($reportType === 'student')
            <section class="grid gap-4 md:grid-cols-4" data-stagger>
                <article class="metric-card">
                    <p class="metric-label">Student</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ $student->name }}</p>
                </article>
                <article class="metric-card">
                    <p class="metric-label">Average Accuracy</p>
                    <p class="metric-value text-brand-700">{{ number_format($payload['average'], 1) }}%</p>
                </article>
                <article class="metric-card">
                    <p class="metric-label">Completion Rate</p>
                    <p class="metric-value text-emerald-700">{{ number_format($payload['completion_rate'], 1) }}%</p>
                </article>
                <article class="metric-card">
                    <p class="metric-label">Consistency Score</p>
                    <p class="metric-value">{{ number_format($payload['consistency_score'], 1) }}</p>
                </article>
            </section>

            <section class="grid gap-6 lg:grid-cols-2" data-stagger>
                <article class="panel p-5">
                    <h2 class="section-title text-emerald-700">Strongest Topics</h2>
                    <div class="mt-3 space-y-2">
                        @forelse ($payload['strongest_topics'] as $topic)
                            <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                <p class="text-sm font-semibold text-slate-900">{{ $topic['topic'] }}</p>
                                <p class="text-xs text-slate-500">{{ $topic['lesson'] }}</p>
                                <p class="mt-1 text-xs text-slate-600">Mastery: {{ number_format($topic['mastery_score'], 1) }} | Attempts: {{ $topic['attempts'] }}</p>
                            </div>
                        @empty
                            <div class="empty-state">No strongest topics identified.</div>
                        @endforelse
                    </div>
                </article>

                <article class="panel p-5">
                    <h2 class="section-title text-rose-700">Weakest Topics</h2>
                    <div class="mt-3 space-y-2">
                        @forelse ($payload['weakest_topics'] as $topic)
                            <div class="rounded-xl border border-rose-200 bg-rose-50 p-3">
                                <p class="text-sm font-semibold text-slate-900">{{ $topic['topic'] }}</p>
                                <p class="text-xs text-slate-500">{{ $topic['lesson'] }}</p>
                                <p class="mt-1 text-xs text-slate-600">Low score rate: {{ number_format($topic['low_score_rate'], 1) }}%</p>
                            </div>
                        @empty
                            <div class="empty-state">No weak topics identified.</div>
                        @endforelse
                    </div>
                </article>
            </section>

            <section class="panel p-5">
                <h2 class="section-title">Detailed Scores</h2>
                <div class="table-wrap mt-4">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Lesson</th>
                                <th>Topic</th>
                                <th>Activity</th>
                                <th>Score</th>
                                <th>Accuracy</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($payload['records'] as $record)
                                <tr>
                                    <td>{{ $record->lesson?->title }}</td>
                                    <td>{{ $record->topic?->title }}</td>
                                    <td>{{ $record->activity?->title }}</td>
                                    <td>{{ number_format($record->score, 1) }}/{{ number_format($record->max_score, 1) }}</td>
                                    <td>{{ number_format($record->accuracy, 1) }}%</td>
                                    <td>{{ optional($record->attempted_at)->format('M d, Y') }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" class="text-center text-slate-500">No records found.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </section>
        @elseif ($reportType === 'section')
            <section class="grid gap-4 md:grid-cols-4" data-stagger>
                <article class="metric-card">
                    <p class="metric-label">Section</p>
                    <p class="mt-2 text-sm font-semibold text-slate-900">{{ $section->name }}</p>
                </article>
                <article class="metric-card">
                    <p class="metric-label">Average Accuracy</p>
                    <p class="metric-value text-brand-700">{{ number_format($payload['average'], 1) }}%</p>
                </article>
                <article class="metric-card">
                    <p class="metric-label">Completion Rate</p>
                    <p class="metric-value text-emerald-700">{{ number_format($payload['completion_rate'], 1) }}%</p>
                </article>
                <article class="metric-card">
                    <p class="metric-label">Record Count</p>
                    <p class="metric-value">{{ $payload['records']->count() }}</p>
                </article>
            </section>

            <section class="grid gap-6 lg:grid-cols-2" data-stagger>
                <article class="panel p-5">
                    <h2 class="section-title text-emerald-700">Strongest Topics</h2>
                    <div class="mt-3 space-y-2">
                        @forelse ($payload['strongest_topics'] as $topic)
                            <div class="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                <p class="text-sm font-semibold text-slate-900">{{ $topic['topic'] }}</p>
                                <p class="text-xs text-slate-500">{{ $topic['lesson'] }}</p>
                                <p class="mt-1 text-xs text-slate-600">Mastery: {{ number_format($topic['mastery_score'], 1) }}</p>
                            </div>
                        @empty
                            <div class="empty-state">No section mastery highlights available.</div>
                        @endforelse
                    </div>
                </article>
                <article class="panel p-5">
                    <h2 class="section-title text-rose-700">Weakest Topics</h2>
                    <div class="mt-3 space-y-2">
                        @forelse ($payload['weakest_topics'] as $topic)
                            <div class="rounded-xl border border-rose-200 bg-rose-50 p-3">
                                <p class="text-sm font-semibold text-slate-900">{{ $topic['topic'] }}</p>
                                <p class="text-xs text-slate-500">{{ $topic['lesson'] }}</p>
                                <p class="mt-1 text-xs text-slate-600">Completion: {{ number_format($topic['completion_rate'], 1) }}%</p>
                            </div>
                        @empty
                            <div class="empty-state">No section weak-topic data available.</div>
                        @endforelse
                    </div>
                </article>
            </section>

            <section class="panel p-5">
                <h2 class="section-title">Intervention Targets</h2>
                <div class="table-wrap mt-4">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Average</th>
                                <th>Attempts</th>
                                <th>Low Score Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($payload['intervention_targets'] as $target)
                                <tr>
                                    <td class="font-semibold text-slate-800">{{ $target['student'] }}</td>
                                    <td>{{ number_format($target['average'], 1) }}%</td>
                                    <td>{{ $target['attempts'] }}</td>
                                    <td>{{ number_format($target['low_score_rate'], 1) }}%</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="4" class="text-center text-slate-500">No intervention targets identified.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </section>
        @else
            <section class="panel p-5">
                <h2 class="section-title">Summary Analytics (Risk Prioritized)</h2>
                <div class="table-wrap mt-4">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Section</th>
                                <th>Lesson</th>
                                <th>Topic</th>
                                <th>Avg Accuracy</th>
                                <th>Completion</th>
                                <th>Risk Index</th>
                                <th>Attempts</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($payload['summary'] as $row)
                                <tr>
                                    <td>{{ $row['section'] }}</td>
                                    <td>{{ $row['lesson'] }}</td>
                                    <td class="font-semibold text-slate-800">{{ $row['topic'] }}</td>
                                    <td>{{ number_format($row['average_accuracy'], 1) }}%</td>
                                    <td>{{ number_format($row['completion_rate'], 1) }}%</td>
                                    <td>{{ number_format($row['risk_index'], 1) }}</td>
                                    <td>{{ $row['total_attempts'] }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="7" class="text-center text-slate-500">No summary data available.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </section>
        @endif

        <section class="panel p-5">
            <h2 class="section-title">Teacher Summary Remarks</h2>
            <p class="mt-2 text-sm text-slate-600">
                {{ $payload['remarks'] ?? 'Use low mastery and high risk indicators to set weekly intervention priorities and monitor response to remediation.' }}
            </p>
        </section>
    </div>
</x-app-layout>
