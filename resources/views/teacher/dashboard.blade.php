<x-app-layout title="Teacher Analytics Dashboard">
    @php
        $scoreTrendLabels = collect($analytics['score_trend'])->pluck('date')->map(fn ($date) => \Illuminate\Support\Carbon::parse($date)->format('M d'));
        $scoreTrendValues = collect($analytics['score_trend'])->pluck('value');
        $movingTrendValues = collect($analytics['score_trend_moving_avg'])->pluck('value');
        $distributionLabels = array_keys($analytics['score_distribution']);
        $distributionValues = array_values($analytics['score_distribution']);
        $sectionLabels = collect($analytics['section_comparison'])->pluck('section');
        $sectionValues = collect($analytics['section_comparison'])->pluck('avg_accuracy');
        $sectionCompletionValues = collect($analytics['section_comparison'])->pluck('completion_rate');
        $sectionMasteryValues = collect($analytics['section_comparison'])->pluck('mastery_index');
        $interventionCount = collect($analytics['students_needing_intervention'])->count();
        $trendSummary = $analytics['trend_summary'];
        $trendPointCount = $scoreTrendLabels->count();
    @endphp

    <div class="mobile-fullbleed-fix space-y-6 overflow-x-hidden w-full max-w-full">
        <section class="panel-hero w-full max-w-full p-7">
            <div class="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10"></div>
            <div class="absolute bottom-0 right-8 h-16 w-16 rounded-full bg-white/15"></div>
            <div class="relative flex flex-wrap items-end justify-between gap-6 overflow-hidden">
                <div class="max-w-3xl">
                    <p class="text-xs font-bold uppercase tracking-[0.16em] text-brand-100">Instructional Intelligence</p>
                    <h2 class="mt-2 text-3xl font-semibold leading-tight text-white">Analytics Command Center for Science Mastery</h2>
                    <p class="mt-3 text-sm leading-relaxed text-blue-100">
                        Review class performance, identify weak topics, and prepare remediation strategies with confidence.
                    </p>
                    <div class="mt-4 grid gap-3 sm:grid-cols-3" data-stagger>
                        <div class="glass-strip px-3 py-2">
                            <p class="text-[11px] uppercase tracking-[0.12em] text-blue-100">Students</p>
                            <p class="text-lg font-semibold text-white">{{ $analytics['students_count'] }}</p>
                        </div>
                        <div class="glass-strip px-3 py-2">
                            <p class="text-[11px] uppercase tracking-[0.12em] text-blue-100">Avg Accuracy</p>
                            <p class="text-lg font-semibold text-white">{{ number_format($analytics['avg_class_performance'], 1) }}%</p>
                        </div>
                        <div class="glass-strip px-3 py-2">
                            <p class="text-[11px] uppercase tracking-[0.12em] text-blue-100">Intervention Alerts</p>
                            <p class="text-lg font-semibold text-white">{{ $interventionCount }}</p>
                        </div>
                    </div>
                    <p class="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">
                        @if ($trendSummary['has_previous'])
                            {{ $trendSummary['window_days'] }}-day trend:
                            <span class="{{ $trendSummary['delta'] >= 0 ? 'text-emerald-200' : 'text-rose-200' }}">
                                {{ $trendSummary['delta'] >= 0 ? '+' : '' }}{{ number_format($trendSummary['delta'], 2) }}%
                            </span>
                            vs previous period
                        @else
                            {{ $trendSummary['window_days'] }}-day trend baseline established.
                        @endif
                    </p>
                </div>

                <form class="apple-card-soft w-full max-w-full space-y-3 bg-white/95 p-4 text-slate-800 md:max-w-md">
                    <div>
                        <p class="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Dashboard Window</p>
                        <p class="text-sm font-semibold text-slate-700">Filter the monitoring period</p>
                    </div>
                    <div class="grid min-w-0 gap-3 sm:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">From</label>
                            <input type="date" name="date_from" value="{{ $filters['date_from'] }}" class="input-field">
                        </div>
                        <div>
                            <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">To</label>
                            <input type="date" name="date_to" value="{{ $filters['date_to'] }}" class="input-field">
                        </div>
                    </div>
                    <button class="btn-primary w-full">Refresh Analytics</button>
                </form>
            </div>
        </section>

        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-5" data-stagger>
            <article class="metric-card">
                <p class="metric-label">Total Students</p>
                <p class="metric-value">{{ $analytics['students_count'] }}</p>
                <p class="mt-1 text-xs text-slate-500">Active learners in system</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Total Sections</p>
                <p class="metric-value">{{ $analytics['sections_count'] }}</p>
                <p class="mt-1 text-xs text-slate-500">Handled class groups</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Class Performance</p>
                <p class="metric-value text-brand-700">{{ number_format($analytics['avg_class_performance'], 1) }}%</p>
                <p class="mt-1 text-xs text-slate-500">Overall mastery average</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Attempt Records</p>
                <p class="metric-value">{{ $analytics['total_attempts'] }}</p>
                <p class="mt-1 text-xs text-slate-500">Tracked learning attempts</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Intervention Cases</p>
                <p class="metric-value text-rose-700">{{ $interventionCount }}</p>
                <p class="mt-1 text-xs text-slate-500">Flagged by risk and low-score signals</p>
            </article>
        </section>

        <section class="grid gap-6 xl:grid-cols-3" data-stagger data-no-reveal="true">
            <article class="chart-shell w-full max-w-full xl:col-span-2" data-no-reveal="true">
                <div class="mb-4 flex items-start justify-between gap-3">
                    <div>
                        <p class="section-kicker">Trend Analysis</p>
                        <h3 class="section-title">Score Progress Over Time</h3>
                    </div>
                    <a href="{{ route('teacher.analytics.index') }}" class="btn-secondary px-3 py-2 text-xs">Open Advanced Filters</a>
                </div>
                @if ($scoreTrendLabels->isEmpty())
                    <div class="empty-state">No trend data available for the selected date range.</div>
                @elseif ($trendPointCount < 2)
                    <div class="empty-state">Not enough trend points yet. Expand date range to compare at least two days.</div>
                @else
                    <canvas id="teacher-score-trend" height="145"></canvas>
                @endif
            </article>

            <article class="chart-shell w-full max-w-full" data-no-reveal="true">
                <p class="section-kicker">Distribution</p>
                <h3 class="section-title">Score Buckets</h3>
                <p class="section-copy">How attempts are spread across proficiency bands.</p>
                <div class="mt-4 overflow-hidden">
                    <canvas id="teacher-score-distribution" height="165"></canvas>
                </div>
            </article>
        </section>

        <section class="grid gap-6 lg:grid-cols-2" data-stagger data-no-reveal="true">
            <article class="chart-shell" data-no-reveal="true">
                <p class="section-kicker">Section Benchmark</p>
                <h3 class="section-title">Section Comparison</h3>
                @if ($sectionLabels->isEmpty())
                    <div class="empty-state mt-4">No section performance data available.</div>
                @else
                    <div class="mt-4 overflow-hidden">
                        <canvas id="teacher-section-comparison" height="150"></canvas>
                    </div>
                @endif
            </article>

            <article class="panel p-5">
                <div class="mb-4 flex items-center justify-between">
                    <div>
                        <p class="section-kicker">Class Health</p>
                        <h3 class="section-title">Students Needing Intervention</h3>
                    </div>
                    <a href="{{ route('teacher.insights.index') }}" class="btn-secondary px-3 py-2 text-xs">Decision Support</a>
                </div>
                <div class="space-y-3">
                    @forelse ($analytics['students_needing_intervention'] as $student)
                        <div class="apple-stat-item apple-tint-rose">
                            <p class="text-sm font-semibold text-slate-900">{{ $student['name'] }}</p>
                            <p class="text-xs text-slate-500">{{ $student['section'] ?? 'Unassigned section' }}</p>
                            <div class="mt-2 flex items-center justify-between text-xs font-semibold">
                                <span class="text-rose-700">{{ number_format($student['average_accuracy'], 1) }}% average</span>
                                <span class="text-slate-600">{{ $student['attempts'] }} attempts</span>
                            </div>
                        </div>
                    @empty
                        <div class="apple-stat-item apple-tint-emerald text-sm text-emerald-700">
                            No learners currently flagged for intervention in this period.
                        </div>
                    @endforelse
                </div>
            </article>
        </section>

        <section class="grid gap-6 xl:grid-cols-2" data-stagger>
            <article class="panel p-5">
                <h3 class="section-title">Weak Topics by Section</h3>
                <p class="section-copy">Use this to target remediation per class group.</p>
                <div class="mt-4 space-y-3">
                    @forelse ($analytics['weak_topics_by_section'] as $entry)
                        <div class="apple-stat-item apple-tint-rose">
                            <p class="text-sm font-semibold text-slate-900">{{ $entry['section'] }}</p>
                            <ul class="mt-2 space-y-1 text-xs text-slate-600">
                                @forelse ($entry['topics'] as $topic)
                                    <li>
                                        {{ $topic['topic'] }}
                                        (Risk {{ number_format($topic['risk_index'], 1) }},
                                        Mastery {{ number_format($topic['mastery_score'], 1) }})
                                    </li>
                                @empty
                                    <li>No weak topic signal.</li>
                                @endforelse
                            </ul>
                        </div>
                    @empty
                        <div class="empty-state">No weak topic sections detected in this period.</div>
                    @endforelse
                </div>
            </article>

            <article class="panel p-5">
                <h3 class="section-title">Strong Topics by Section</h3>
                <p class="section-copy">Leverage these for peer-learning and enrichment sessions.</p>
                <div class="mt-4 space-y-3">
                    @forelse ($analytics['strong_topics_by_section'] as $entry)
                        <div class="apple-stat-item apple-tint-emerald">
                            <p class="text-sm font-semibold text-slate-900">{{ $entry['section'] }}</p>
                            <ul class="mt-2 space-y-1 text-xs text-slate-600">
                                @forelse ($entry['topics'] as $topic)
                                    <li>
                                        {{ $topic['topic'] }}
                                        (Mastery {{ number_format($topic['mastery_score'], 1) }},
                                        {{ number_format($topic['avg_accuracy'], 1) }}%)
                                    </li>
                                @empty
                                    <li>No strong topic signal.</li>
                                @endforelse
                            </ul>
                        </div>
                    @empty
                        <div class="empty-state">No strong topic sections detected in this period.</div>
                    @endforelse
                </div>
            </article>
        </section>

        <section class="panel p-5">
            <div class="mb-4">
                <p class="section-kicker">Decision Support</p>
                <h3 class="section-title">Recommended Focus Areas</h3>
            </div>
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-stagger>
                @foreach ($analytics['recommendations'] as $item)
                    <div class="apple-stat-item apple-tint-slate">
                        <p class="text-xs font-bold uppercase tracking-[0.12em] {{ $item['priority'] === 'high' ? 'text-rose-700' : ($item['priority'] === 'medium' ? 'text-amber-700' : 'text-emerald-700') }}">
                            {{ $item['priority'] }} priority
                        </p>
                        <p class="mt-1 text-sm font-semibold text-slate-900">{{ $item['title'] }}</p>
                        <p class="mt-1 text-xs text-slate-600">{{ $item['detail'] }}</p>
                    </div>
                @endforeach
            </div>
        </section>

        <section class="grid gap-6 lg:grid-cols-2" data-stagger>
            <article class="panel p-5">
                <div class="mb-4 flex items-center justify-between">
                    <div>
                        <p class="section-kicker text-emerald-700">Strengths</p>
                        <h3 class="section-title">Most Mastered Topics</h3>
                    </div>
                </div>
                <div class="space-y-2.5">
                    @forelse ($analytics['strongest_topics'] as $index => $topic)
                        <div class="apple-stat-item apple-tint-emerald">
                            <div class="flex items-center justify-between gap-3">
                                <div>
                                    <p class="text-sm font-semibold text-slate-900">{{ $index + 1 }}. {{ $topic['topic'] }}</p>
                                    <p class="text-xs text-slate-500">{{ $topic['lesson'] }}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-semibold text-emerald-700">{{ number_format($topic['weighted_mastery'], 1) }}</p>
                                    <p class="text-[11px] text-slate-500">{{ number_format($topic['avg_accuracy'], 1) }}% accuracy</p>
                                </div>
                            </div>
                        </div>
                    @empty
                        <div class="empty-state">No mastery highlights available yet.</div>
                    @endforelse
                </div>
            </article>

            <article class="panel p-5">
                <div class="mb-4 flex items-center justify-between">
                    <div>
                        <p class="section-kicker text-rose-700">Risk Areas</p>
                        <h3 class="section-title">Least Mastered Topics</h3>
                    </div>
                </div>
                <div class="space-y-2.5">
                    @forelse ($analytics['weakest_topics'] as $index => $topic)
                        <div class="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                            <div class="flex items-center justify-between gap-3">
                                <div>
                                    <p class="text-sm font-semibold text-slate-900">{{ $index + 1 }}. {{ $topic['topic'] }}</p>
                                    <p class="text-xs text-slate-500">{{ $topic['lesson'] }}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-semibold text-rose-700">{{ number_format($topic['risk_index'], 1) }}</p>
                                    <p class="text-[11px] text-slate-500">{{ number_format($topic['low_score_rate'], 1) }}% low-score rate</p>
                                </div>
                            </div>
                        </div>
                    @empty
                        <div class="empty-state">No low mastery topics recorded.</div>
                    @endforelse
                </div>
            </article>
        </section>

        <section class="panel p-5">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p class="section-kicker">Engagement Snapshot</p>
                    <h3 class="section-title">Most Active Students</h3>
                </div>
                <a href="{{ route('teacher.students.index') }}" class="btn-secondary px-3 py-2 text-xs">Manage Students</a>
            </div>
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Section</th>
                            <th>Total Attempts</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($analytics['most_active_students'] as $student)
                            <tr>
                                <td class="font-semibold text-slate-800">{{ $student->student?->name }}</td>
                                <td>{{ $student->student?->studentProfile?->section?->name ?? 'Unassigned' }}</td>
                                <td>{{ $student->total_attempts }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="3" class="text-center text-slate-500">No attempt data available.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </section>
    </div>

    @push('scripts')
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
            const mountTeacherCharts = () => {
                const baseGridColor = 'rgba(100, 116, 139, 0.15)';
                const baseTickColor = '#475569';

                window.glmsRenderChartOnView('teacher-score-trend', (canvas) => {
                    window.glmsBuildChart(canvas, {
                        type: 'line',
                        data: {
                            labels: @json($scoreTrendLabels),
                            datasets: [{
                                label: 'Average Accuracy',
                                data: @json($scoreTrendValues),
                                borderColor: 'rgba(22, 111, 212, 0.65)',
                                backgroundColor: 'rgba(22, 111, 212, 0)',
                                fill: false,
                                pointRadius: 0,
                                pointHoverRadius: 0,
                                borderWidth: 2,
                                tension: 0
                            }, {
                                label: 'Moving Average',
                                data: @json($movingTrendValues),
                                borderColor: '#22a05a',
                                backgroundColor: 'rgba(34, 160, 90, 0)',
                                pointRadius: 0,
                                fill: false,
                                tension: 0,
                                borderDash: [6, 5]
                            }]
                        },
                        options: {
                            animation: false,
                            animations: false,
                            events: [],
                            transitions: {
                                active: { animation: { duration: 0 } },
                                resize: { animation: { duration: 0 } }
                            },
                            plugins: {
                                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: baseTickColor } }
                            },
                            scales: {
                                x: { grid: { display: false }, ticks: { color: baseTickColor } },
                                y: {
                                    beginAtZero: true,
                                    max: 100,
                                    grid: { color: baseGridColor },
                                    ticks: { color: baseTickColor, callback: (value) => `${value}%` }
                                }
                            }
                        }
                    });
                });

                window.glmsRenderChartOnView('teacher-score-distribution', (canvas) => {
                    window.glmsBuildChart(canvas, {
                        type: 'doughnut',
                        data: {
                            labels: @json($distributionLabels),
                            datasets: [{
                                data: @json($distributionValues),
                                backgroundColor: ['#166fd4', '#22a05a', '#f59e0b', '#f97316', '#dc2626'],
                                borderWidth: 0
                            }]
                        },
                        options: {
                            animation: false,
                            animations: false,
                            events: [],
                            transitions: {
                                active: { animation: { duration: 0 } },
                                resize: { animation: { duration: 0 } }
                            },
                            cutout: '68%',
                            plugins: {
                                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: baseTickColor } }
                            }
                        }
                    });
                });

                window.glmsRenderChartOnView('teacher-section-comparison', (canvas) => {
                    window.glmsBuildChart(canvas, {
                        type: 'bar',
                        data: {
                            labels: @json($sectionLabels),
                            datasets: [{
                                label: 'Average Accuracy',
                                data: @json($sectionValues),
                                borderRadius: 12,
                                backgroundColor: 'rgba(39, 137, 242, 0.72)'
                            }, {
                                label: 'Completion Rate',
                                data: @json($sectionCompletionValues),
                                borderRadius: 12,
                                backgroundColor: 'rgba(34, 160, 90, 0.68)'
                            }, {
                                type: 'line',
                                label: 'Mastery Index',
                                data: @json($sectionMasteryValues),
                                borderColor: '#f59e0b',
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                pointRadius: 2.5,
                                pointBackgroundColor: '#f59e0b',
                                tension: 0.35,
                                yAxisID: 'y'
                            }]
                        },
                        options: {
                            animation: false,
                            animations: false,
                            events: [],
                            transitions: {
                                active: { animation: { duration: 0 } },
                                resize: { animation: { duration: 0 } }
                            },
                            plugins: {
                                legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: baseTickColor } }
                            },
                            scales: {
                                x: { grid: { display: false }, ticks: { color: baseTickColor } },
                                y: {
                                    beginAtZero: true,
                                    max: 100,
                                    grid: { color: baseGridColor },
                                    ticks: { color: baseTickColor, callback: (value) => `${value}%` }
                                }
                            }
                        }
                    });
                });
            };

            if (typeof window.glmsRenderChartOnView === 'function' && typeof window.glmsBuildChart === 'function') {
                mountTeacherCharts();
            } else {
                window.addEventListener('DOMContentLoaded', mountTeacherCharts, { once: true });
            }
        </script>
    @endpush
</x-app-layout>
