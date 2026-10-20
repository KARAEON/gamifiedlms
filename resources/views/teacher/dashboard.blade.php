<x-app-layout title="Classroom overview">
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

    <div class="teacher-dashboard space-y-6 w-full max-w-full">
        <x-staff.page-heading title="Adventure overview" description="Your classroom at a glance. Every small win counts." eyebrow="Your teaching journey">
<a href="{{ route('teacher.workflow.index') }}" class="btn-primary"><x-teacher.icon name="map" /> Review mastery</a><a href="{{ route('teacher.reports.index') }}" class="btn-secondary"><x-teacher.icon name="scroll" /> Reports</a></x-staff.page-heading>


        <section class="teacher-welcome" aria-labelledby="teacher-welcome-title">
            <img class="teacher-welcome-art" src="{{ asset('assets/world/lumora-world.png') }}" alt="" fetchpriority="high">
            <div class="teacher-hero-stars" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span></div>
            <div class="teacher-welcome-copy">
                <span class="teacher-welcome-eyebrow"><span aria-hidden="true">✦</span> Welcome back, {{ auth()->user()->name }}</span>
                <h2 id="teacher-welcome-title">LET'S MAKE<br>LEARNING <em>EPIC.</em></h2>
                <p>Big discoveries start with you. Guide your learners, celebrate their progress, and bring the next adventure to life.</p>
                <a href="{{ route('teacher.sections.index') }}" class="teacher-welcome-link"><x-teacher.icon name="compass" /> Explore your classes <span aria-hidden="true">&rarr;</span></a>
            </div>
            <div class="teacher-world-caption"><x-teacher.icon name="flag" /><span>LUMORA WORLD<small>A little curiosity. Endless possibilities.</small></span></div>
        </section>

        <section class="teacher-stats grid gap-3 md:grid-cols-2 xl:grid-cols-5" aria-label="Classroom statistics">
            <x-staff.metric label="Learners" value="{{ $analytics['students_count'] }}" hint="On their learning journey" icon="learners" />
            <x-staff.metric label="Your sections" value="{{ $analytics['sections_count'] }}" hint="Adventures to guide" icon="sections" />
            <x-staff.metric label="Class performance" value="{{ number_format($analytics['avg_class_performance'], 1) }}%" hint="Average learner accuracy" icon="trophy" />
            <x-staff.metric label="Learning attempts" value="{{ $analytics['total_attempts'] }}" hint="Steps toward mastery" icon="crystal" />
            <x-staff.metric label="Need a little help" value="{{ $interventionCount }}" hint="Learners needing support" tone="alert" icon="shield" />
        </section>

        <div class="teacher-quest-heading"><div><p class="section-kicker">Ready when you are</p><h2>Choose your next quest</h2></div><span>Great learning starts here <span aria-hidden="true">✦</span></span></div>
        <nav class="teacher-quests" aria-label="Teaching shortcuts">
            <a href="{{ route('teacher.lessons.index') }}" class="teacher-quest teacher-quest-library">
                <div class="teacher-quest-scene"><img src="{{ asset('assets/world/reading-island.png') }}" alt="" loading="lazy"><span class="teacher-quest-number">01 / PREPARE</span><span class="teacher-quest-badge"><x-teacher.icon name="book" /></span></div>
                <div class="teacher-quest-copy"><h3>Build the next adventure</h3><p>Bring lessons and topics to life.</p><span>Open lesson library <span aria-hidden="true">&rarr;</span></span></div>
            </a>
            <a href="{{ route('teacher.scores.index') }}" class="teacher-quest teacher-quest-progress">
                <div class="teacher-quest-scene"><img src="{{ asset('assets/world/numeric-island.png') }}" alt="" loading="lazy"><span class="teacher-quest-number">02 / DISCOVER</span><span class="teacher-quest-badge"><x-teacher.icon name="trophy" /></span></div>
                <div class="teacher-quest-copy"><h3>Follow every achievement</h3><p>See how your learners are growing.</p><span>Explore game scores <span aria-hidden="true">&rarr;</span></span></div>
            </a>
            <a href="{{ route('teacher.insights.index') }}" class="teacher-quest teacher-quest-support">
                <div class="teacher-quest-scene"><img src="{{ asset('assets/world/concord-grove.png') }}" alt="" loading="lazy"><span class="teacher-quest-number">03 / ENCOURAGE</span><span class="teacher-quest-badge"><x-teacher.icon name="spark" /></span></div>
                <div class="teacher-quest-copy"><h3>Help a learner shine</h3><p>A little support goes a long way.</p><span>Find your next step <span aria-hidden="true">&rarr;</span></span></div>
            </a>
        </nav>

        <aside class="teacher-guide"><img src="{{ asset('assets/characters/quill/quill-default.png') }}" alt="Quill, your adventure guide" loading="lazy"><div><strong>A note from Quill <span aria-hidden="true">✦</span></strong><p>Every attempt is a step forward. Check in on a learner today and help their confidence grow.</p></div><a href="{{ route('teacher.students.index') }}">Meet your learners <span aria-hidden="true">&rarr;</span></a></aside>

<x-staff.toolbar title="Monitoring period"><form method="GET" class="grid gap-3 md:grid-cols-[1fr_2fr_auto] items-end">
                    <div>
                        <p class="section-kicker">Date range</p>
                        <p class="text-sm font-semibold text-slate-700">Learning activity period</p>
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
                    <button class="btn-primary w-full">Apply date range</button>
                </form>
<p class="mt-3 text-xs text-slate-500">@if ($trendSummary['has_previous']){{ (int) round($trendSummary['window_days']) }}-day change: {{ $trendSummary['delta'] >= 0 ? '+' : '' }}{{ number_format($trendSummary['delta'], 2) }} percentage points compared with the previous period.@else No previous period is available for comparison.@endif</p></x-staff.toolbar>



<section class="grid gap-6 lg:grid-cols-2" data-stagger data-no-reveal="true">
            <article class="panel p-5">
                <div class="mb-4 flex items-center justify-between">
                    <div>
                        <p class="section-kicker">Class Health</p>
                        <h3 class="section-title">Students Needing Intervention</h3>
                    </div>
                    <a href="{{ route('teacher.insights.index') }}" class="btn-secondary px-3 py-2 text-xs">Decision Support</a>
                </div>
                <div class="space-y-3">
                    @forelse (collect($analytics['students_needing_intervention'])->take(4) as $student)
                        <div class="apple-stat-item apple-tint-rose">
                            <a class="text-sm font-semibold text-brand-700" href="{{ route('teacher.students.show', $student['student_id']) }}">{{ $student['name'] }}</a>
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
