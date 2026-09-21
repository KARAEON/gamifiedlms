<x-app-layout title="Decision Support">
    <div class="space-y-6">
        <section class="panel-hero p-6">
            <div class="relative z-10">
                <p class="section-kicker text-brand-100">Intervention Planning</p>
                <h2 class="mt-1 text-3xl font-semibold text-white">Decision-Making Support Dashboard</h2>
                <p class="mt-2 max-w-3xl text-sm leading-relaxed text-blue-100">
                    Translate analytics into action with prioritized focus areas, section signals, and learner intervention lists.
                </p>
                <div class="mt-4 grid gap-3 sm:grid-cols-3" data-stagger>
                    <div class="glass-strip px-3 py-2">
                        <p class="text-[11px] uppercase tracking-[0.12em] text-blue-100">Trend Delta</p>
                        <p class="text-lg font-semibold {{ $trendSummary['delta'] >= 0 ? 'text-emerald-200' : 'text-rose-200' }}">
                            {{ $trendSummary['has_previous'] ? ($trendSummary['delta'] >= 0 ? '+' : '').number_format($trendSummary['delta'], 2).'%' : 'Baseline' }}
                        </p>
                    </div>
                    <div class="glass-strip px-3 py-2">
                        <p class="text-[11px] uppercase tracking-[0.12em] text-blue-100">Section Gap</p>
                        <p class="text-lg font-semibold text-white">{{ number_format($sectionMasteryGap, 2) }}</p>
                    </div>
                    <div class="glass-strip px-3 py-2">
                        <p class="text-[11px] uppercase tracking-[0.12em] text-blue-100">Intervention Cases</p>
                        <p class="text-lg font-semibold text-white">{{ $studentsBelowThreshold->count() }}</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="panel p-5" x-data="teacherAiInsights('{{ route('teacher.insights.ai.generate') }}')" data-no-reveal="true">
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p class="section-kicker">AI Intervention Briefing</p>
                    <h3 class="section-title">One-Click Narrative Analysis</h3>
                    <p class="section-copy">Generate a concise classroom narrative, at-risk strategy, and critical student focus from recent performance data.</p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <button type="button" class="btn-primary" @click="runAnalysis" :disabled="loading">
                        <span x-show="!loading">Run AI Analysis</span>
                        <span x-show="loading" x-cloak>Processing...</span>
                    </button>
                    <button type="button" class="btn-secondary" @click="showRoster = !showRoster" x-show="roster.length > 0" x-cloak>
                        <span x-text="showRoster ? 'Hide Gradebook' : 'View Gradebook'"></span>
                    </button>
                </div>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span x-show="source" x-cloak :class="source === 'ollama' ? 'badge border-emerald-200 bg-emerald-50 text-emerald-700' : 'badge border-amber-200 bg-amber-50 text-amber-700'" x-text="source === 'ollama' ? 'Narrative mode: Enhanced' : 'Narrative mode: Standard'"></span>
                <span x-show="window?.date_from && window?.date_to" x-cloak class="badge border-slate-200 bg-slate-50 text-slate-600" x-text="`Window: ${window.date_from} to ${window.date_to}`"></span>
            </div>

            <p x-show="warning" x-cloak class="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700" x-text="warning"></p>

            <div class="mt-4 grid gap-3 lg:grid-cols-3">
                <article class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <h4 class="text-sm font-semibold text-emerald-800">Tier 1: Whole Class Analysis</h4>
                    <p class="mt-2 text-sm leading-relaxed text-slate-700" x-text="analysis.class_analysis"></p>
                </article>
                <article class="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <h4 class="text-sm font-semibold text-amber-800">Tier 2: At-Risk Group Strategy</h4>
                    <p class="mt-2 text-sm leading-relaxed text-slate-700" x-text="analysis.at_risk_group_strategy"></p>
                </article>
                <article class="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <h4 class="text-sm font-semibold text-rose-800">Tier 3: Critical Student Focus</h4>
                    <p class="mt-2 text-sm leading-relaxed text-slate-700" x-text="analysis.critical_student_focus"></p>
                </article>
            </div>

            <div class="mt-4 table-wrap" x-show="showRoster && roster.length > 0" x-cloak>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th scope="col">Student</th>
                            <th scope="col">Section</th>
                            <th scope="col">Science Avg</th>
                            <th scope="col">Attempts</th>
                            <th scope="col">Risk</th>
                            <th scope="col">Failing Topics</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template x-for="row in roster" :key="row.student_id">
                            <tr>
                                <td class="py-3 font-semibold text-slate-800" x-text="row.student_name"></td>
                                <td class="py-3 text-slate-600" x-text="row.section"></td>
                                <td class="py-3 text-slate-700" x-text="`${Number(row.average_accuracy).toFixed(1)}%`"></td>
                                <td class="py-3 text-slate-700" x-text="row.attempts"></td>
                                <td class="py-3">
                                    <span class="badge" :class="riskClass(row.risk_level)" x-text="row.risk_level"></span>
                                </td>
                                <td class="py-3 text-slate-600" x-text="formatTopics(row.failing_topics)"></td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </section>

        <section class="grid gap-6 lg:grid-cols-2" data-stagger>
            <article class="panel p-5">
                <h3 class="section-title text-rose-700">Highest Risk Topics</h3>
                <div class="mt-4 space-y-2.5">
                    @forelse ($leastMastered as $topic)
                        <div class="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                            <div class="flex items-center justify-between gap-3">
                                <div>
                                    <p class="text-sm font-semibold text-slate-900">{{ $topic['topic'] }}</p>
                                    <p class="text-xs text-slate-500">{{ $topic['lesson'] }}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-xs text-slate-500">Risk</p>
                                    <p class="text-sm font-semibold text-rose-700">{{ number_format($topic['risk_index'], 1) }}</p>
                                </div>
                            </div>
                            <p class="mt-1 text-xs text-slate-600">Low score rate: {{ number_format($topic['low_score_rate'], 1) }}%</p>
                        </div>
                    @empty
                        <div class="empty-state">No high-risk topics detected.</div>
                    @endforelse
                </div>
            </article>

            <article class="panel p-5">
                <h3 class="section-title text-emerald-700">Most Stable Mastery Topics</h3>
                <div class="mt-4 space-y-2.5">
                    @forelse ($mostMastered as $topic)
                        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                            <div class="flex items-center justify-between gap-3">
                                <div>
                                    <p class="text-sm font-semibold text-slate-900">{{ $topic['topic'] }}</p>
                                    <p class="text-xs text-slate-500">{{ $topic['lesson'] }}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-xs text-slate-500">Mastery</p>
                                    <p class="text-sm font-semibold text-emerald-700">{{ number_format($topic['weighted_mastery'], 1) }}</p>
                                </div>
                            </div>
                            <p class="mt-1 text-xs text-slate-600">Completion: {{ number_format($topic['completion_rate'], 1) }}%</p>
                        </div>
                    @empty
                        <div class="empty-state">No strong mastery topics identified.</div>
                    @endforelse
                </div>
            </article>
        </section>

        <section class="grid gap-6 xl:grid-cols-2" data-stagger>
            <article class="panel p-5">
                <h3 class="section-title">Students Below Threshold</h3>
                <div class="mt-4 space-y-3">
                    @forelse ($studentsBelowThreshold as $student)
                        <div class="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                            <div class="flex items-center justify-between gap-3">
                                <div>
                                    <p class="text-sm font-semibold text-slate-900">{{ $student['name'] }}</p>
                                    <p class="text-xs text-slate-500">{{ $student['section'] ?? 'Unassigned' }}</p>
                                </div>
                                <div class="text-right text-xs">
                                    <p class="font-semibold text-amber-700">{{ number_format($student['average_accuracy'], 1) }}%</p>
                                    <p class="text-slate-500">{{ $student['attempts'] }} attempts</p>
                                </div>
                            </div>
                        </div>
                    @empty
                        <div class="empty-state">No students currently below the threshold.</div>
                    @endforelse
                </div>
            </article>

            <article class="panel p-5">
                <h3 class="section-title">Repeated Low Performance</h3>
                <div class="mt-4 space-y-3">
                    @forelse ($repeatedLowPerformance as $student)
                        <div class="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                            <p class="text-sm font-semibold text-slate-900">{{ $student['student'] }}</p>
                            <p class="text-xs text-slate-500">{{ $student['section'] ?? 'Unassigned' }}</p>
                            <p class="mt-1 text-xs text-slate-600">{{ number_format($student['average'], 1) }}% average | {{ $student['low_attempts'] }} low attempts</p>
                        </div>
                    @empty
                        <div class="empty-state">No repeated low-performance pattern detected.</div>
                    @endforelse
                </div>
            </article>
        </section>

        <section class="grid gap-6 xl:grid-cols-2" data-stagger>
            <article class="panel p-5">
                <h3 class="section-title">Weak Topics by Section</h3>
                <div class="mt-4 space-y-3">
                    @forelse ($weakTopicsBySection as $entry)
                        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
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
                        <div class="empty-state">No section-topic risk signals available.</div>
                    @endforelse
                </div>
            </article>

            <article class="panel p-5">
                <h3 class="section-title">Strong Topics by Section</h3>
                <div class="mt-4 space-y-3">
                    @forelse ($strongTopicsBySection as $entry)
                        <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
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
                        <div class="empty-state">No section-topic mastery signals available.</div>
                    @endforelse
                </div>
            </article>
        </section>

        <section class="panel p-5">
            <h3 class="section-title">Recommended Intervention Summary</h3>
            <ul class="mt-4 space-y-2 text-sm text-slate-700">
                @forelse ($recommendedFocusAreas as $focusArea)
                    <li class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">{{ $focusArea }}</li>
                @empty
                    <li class="text-slate-500">No recommendation generated yet.</li>
                @endforelse
            </ul>
        </section>
    </div>

    @push('scripts')
        <script>
            document.addEventListener('alpine:init', () => {
                Alpine.data('teacherAiInsights', (endpoint) => ({
                    loading: false,
                    showRoster: false,
                    source: null,
                    warning: null,
                    window: null,
                    analysis: {
                        class_analysis: 'Click "Run AI Analysis" to generate a class narrative summary.',
                        at_risk_group_strategy: 'At-risk strategy will appear after analysis.',
                        critical_student_focus: 'Critical student recommendation will appear after analysis.',
                    },
                    roster: [],
                    async runAnalysis() {
                        this.loading = true;
                        this.warning = null;

                        try {
                            const response = await fetch(endpoint, {
                                method: 'GET',
                                headers: {
                                    Accept: 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                            });

                            const payload = await response.json();

                            if (!response.ok || payload.status !== 'success') {
                                throw new Error(payload.message ?? 'AI analysis request failed.');
                            }

                            this.analysis = payload.data ?? this.analysis;
                            this.roster = Array.isArray(payload.roster) ? payload.roster : [];
                            this.source = payload.source ?? null;
                            this.warning = payload.warning ?? null;
                            this.window = payload.window ?? null;
                            this.showRoster = false;
                        } catch (error) {
                            this.warning = error?.message ?? 'Unable to reach AI analysis service.';
                            console.error(error);
                        } finally {
                            this.loading = false;
                        }
                    },
                    formatTopics(topics) {
                        if (!Array.isArray(topics) || topics.length === 0) {
                            return 'None';
                        }
                        return topics.join(', ');
                    },
                    riskClass(riskLevel) {
                        if (riskLevel === 'high') {
                            return 'border-rose-200 bg-rose-50 text-rose-700';
                        }

                        if (riskLevel === 'moderate') {
                            return 'border-amber-200 bg-amber-50 text-amber-700';
                        }

                        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
                    },
                }));
            });
        </script>
    @endpush
</x-app-layout>
