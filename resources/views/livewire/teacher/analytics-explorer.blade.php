@php
    $activeFilters = collect([
        'Date from' => $date_from,
        'Date to' => $date_to,
        'Section' => $section_id ? optional($sections->firstWhere('id', $section_id))->name : null,
        'Student' => $student_id ? optional($students->firstWhere('id', $student_id))->name : null,
        'Lesson' => $lesson_id ? optional($lessons->firstWhere('id', $lesson_id))->title : null,
        'Topic' => $topic_id ? optional($topics->firstWhere('id', $topic_id))->title : null,
        'Activity type' => $activity_type ? (\App\Enums\ActivityType::labels()[$activity_type] ?? $activity_type) : null,
    ])->filter(fn ($value) => filled($value));
@endphp

<div class="space-y-6">
    <section class="filter-panel">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
                <p class="section-kicker">Analytics Filters</p>
                <h3 class="section-title">Refine Performance Insights</h3>
                <p class="section-copy">Narrow data by date, class context, and activity profile.</p>
            </div>
            <div class="flex flex-wrap gap-2">
                <button type="button" wire:click="setQuickRange(7)" class="btn-secondary px-3 py-2 text-xs">Last 7 days</button>
                <button type="button" wire:click="setQuickRange(14)" class="btn-secondary px-3 py-2 text-xs">Last 14 days</button>
                <button type="button" wire:click="setQuickRange(30)" class="btn-secondary px-3 py-2 text-xs">Last 30 days</button>
                <button type="button" wire:click="clearFilters" class="btn-ghost">Reset</button>
            </div>
        </div>

        <form wire:submit.prevent="applyFilters" class="grid gap-3 lg:grid-cols-4">
            <div>
                <label class="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">From</label>
                <input type="date" wire:model="date_from" class="input-field">
            </div>
            <div>
                <label class="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">To</label>
                <input type="date" wire:model="date_to" class="input-field">
            </div>
            <div>
                <label class="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Section</label>
                <select wire:model="section_id" class="input-field">
                    <option value="">All sections</option>
                    @foreach ($sections as $section)
                        <option value="{{ $section->id }}">{{ $section->name }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Student</label>
                <select wire:model="student_id" class="input-field">
                    <option value="">All students</option>
                    @foreach ($students as $student)
                        <option value="{{ $student->id }}">{{ $student->name }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Lesson</label>
                <select wire:model="lesson_id" class="input-field">
                    <option value="">All lessons</option>
                    @foreach ($lessons as $lesson)
                        <option value="{{ $lesson->id }}">{{ $lesson->title }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Topic</label>
                <select wire:model="topic_id" class="input-field">
                    <option value="">All topics</option>
                    @foreach ($topics as $topic)
                        <option value="{{ $topic->id }}">{{ $topic->title }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Activity Type</label>
                <select wire:model="activity_type" class="input-field">
                    <option value="">All types</option>
                    @foreach (\App\Enums\ActivityType::labels() as $value => $label)
                        <option value="{{ $value }}">{{ $label }}</option>
                    @endforeach
                </select>
            </div>
            <div class="flex items-end">
                <button class="btn-primary w-full" wire:loading.attr="disabled">
                    <span wire:loading.remove>Apply Filters</span>
                    <span wire:loading>Refreshing...</span>
                </button>
            </div>
        </form>

        <div class="mt-4">
            <p class="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Active Scope</p>
            <div class="mt-2 flex flex-wrap gap-2">
                @forelse ($activeFilters as $label => $value)
                    <span class="badge bg-white text-slate-700 ring-1 ring-slate-200">{{ $label }}: {{ $value }}</span>
                @empty
                    <span class="text-xs text-slate-500">No additional filters applied.</span>
                @endforelse
            </div>
        </div>
    </section>

    <div wire:loading class="grid gap-3 md:grid-cols-3">
        <div class="skeleton h-24"></div>
        <div class="skeleton h-24"></div>
        <div class="skeleton h-24"></div>
    </div>

    <div wire:loading.remove class="space-y-6">
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-6" data-stagger>
            <article class="metric-card">
                <p class="metric-label">Average Score</p>
                <p class="metric-value">{{ number_format($analytics['average_score'], 1) }}</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Accuracy Rate</p>
                <p class="metric-value text-brand-700">{{ number_format($analytics['accuracy_rate'], 1) }}%</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Total Attempts</p>
                <p class="metric-value">{{ $analytics['total_attempts'] }}</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Intervention Cases</p>
                <p class="metric-value text-rose-700">{{ collect($analytics['students_needing_intervention'])->count() }}</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Section Mean Mastery</p>
                <p class="metric-value">{{ number_format($analytics['section_mastery_average'], 1) }}</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Trend Delta</p>
                <p class="metric-value {{ $analytics['trend_summary']['delta'] >= 0 ? 'text-emerald-700' : 'text-rose-700' }}">
                    {{ $analytics['trend_summary']['delta'] >= 0 ? '+' : '' }}{{ number_format($analytics['trend_summary']['delta'], 2) }}%
                </p>
                <p class="mt-1 text-xs text-slate-500">
                    @if ($analytics['trend_summary']['has_previous'])
                        vs previous {{ $analytics['trend_summary']['window_days'] }}-day window
                    @else
                        baseline window without previous comparison
                    @endif
                </p>
            </article>
        </section>

        <section class="grid gap-6 xl:grid-cols-2" data-stagger>
            <article class="panel p-4">
                <h3 class="section-title">Section Comparison Matrix</h3>
                <p class="section-copy">Mastery index combines accuracy, completion, and consistency.</p>
                <div class="table-wrap mt-4">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Section</th>
                                <th>Mastery</th>
                                <th>Vs Class</th>
                                <th>Accuracy</th>
                                <th>Completion</th>
                                <th>Stability</th>
                                <th>At Risk</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($analytics['section_comparison'] as $section)
                                <tr>
                                    <td class="font-semibold text-slate-800">{{ $section['rank'] }}. {{ $section['section'] }}</td>
                                    <td>{{ number_format($section['mastery_index'], 1) }}</td>
                                    <td class="{{ $section['vs_class_delta'] >= 0 ? 'text-emerald-700' : 'text-rose-700' }}">
                                        {{ $section['vs_class_delta'] >= 0 ? '+' : '' }}{{ number_format($section['vs_class_delta'], 1) }}
                                    </td>
                                    <td>{{ number_format($section['avg_accuracy'], 1) }}%</td>
                                    <td>{{ number_format($section['completion_rate'], 1) }}%</td>
                                    <td>{{ number_format($section['stability'], 1) }}</td>
                                    <td>{{ $section['below_threshold_students'] }} / {{ $section['students_count'] }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="7" class="text-center text-slate-500">No section comparison records.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
                <p class="mt-3 text-xs font-semibold text-slate-500">
                    Section mastery gap: {{ number_format($analytics['section_mastery_gap'], 2) }} points |
                    Class mean mastery: {{ number_format($analytics['section_mastery_average'], 2) }}
                </p>
            </article>

            <article class="panel p-4">
                <h3 class="section-title">Section Topic Signals</h3>
                <p class="section-copy">Compare risk topics and mastery topics inside each section.</p>
                <div class="mt-4 space-y-3">
                    @forelse ($analytics['weak_topics_by_section'] as $sectionTopics)
                        <div class="rounded-2xl border border-rose-200 bg-rose-50 p-3">
                            <p class="text-sm font-semibold text-slate-900">{{ $sectionTopics['section'] }}</p>
                            <p class="mt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-rose-700">Risk Topics</p>
                            <ul class="mt-1 space-y-1 text-xs text-slate-600">
                                @forelse ($sectionTopics['topics'] as $topic)
                                    <li>
                                        {{ $topic['topic'] }}:
                                        risk {{ number_format($topic['risk_index'], 1) }},
                                        mastery {{ number_format($topic['mastery_score'], 1) }}
                                    </li>
                                @empty
                                    <li>No low-topic signal available.</li>
                                @endforelse
                            </ul>

                            @php
                                $strong = collect($analytics['strong_topics_by_section'])->firstWhere('section', $sectionTopics['section']);
                            @endphp
                            <p class="mt-3 text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-700">Strength Topics</p>
                            <ul class="mt-1 space-y-1 text-xs text-slate-600">
                                @forelse ($strong['topics'] ?? [] as $topic)
                                    <li>
                                        {{ $topic['topic'] }}:
                                        mastery {{ number_format($topic['mastery_score'], 1) }},
                                        {{ number_format($topic['avg_accuracy'], 1) }}% accuracy
                                    </li>
                                @empty
                                    <li>No high-mastery topic signal.</li>
                                @endforelse
                            </ul>
                        </div>
                    @empty
                        <div class="empty-state">No section-topic signals found for selected filters.</div>
                    @endforelse
                </div>
            </article>
        </section>

        <section class="grid gap-6 xl:grid-cols-2" data-stagger>
            <article class="panel p-4">
                <h3 class="section-title">Topic Mastery and Risk Analysis</h3>
                <div class="table-wrap mt-4">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Topic</th>
                                <th>Lesson</th>
                                <th>Mastery</th>
                                <th>Band</th>
                                <th>Risk</th>
                                <th>Low Score Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($analytics['topic_mastery_ranking'] as $topic)
                                <tr>
                                    <td class="font-semibold text-slate-800">{{ $topic['topic'] }}</td>
                                    <td>{{ $topic['lesson'] }}</td>
                                    <td>{{ number_format($topic['weighted_mastery'], 1) }}</td>
                                    <td class="capitalize">{{ $topic['mastery_band'] }}</td>
                                    <td>{{ number_format($topic['risk_index'], 1) }}</td>
                                    <td>{{ number_format($topic['low_score_rate'], 1) }}%</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="6" class="text-center text-slate-500">No mastery analytics available.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </article>

            <article class="panel p-4">
                <h3 class="section-title">Mastery Heatmap Snapshot</h3>
                <p class="section-copy">Top section-topic combinations by activity volume.</p>
            <div class="mt-4 grid gap-2 sm:grid-cols-2" data-stagger>
                    @forelse ($analytics['mastery_heatmap'] as $row)
                        @php
                            $tone = $row['avg_accuracy'] >= 85
                                ? 'bg-emerald-50 border-emerald-200'
                                : ($row['avg_accuracy'] >= 70 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200');
                        @endphp
                        <div class="rounded-xl border p-2.5 {{ $tone }}">
                            <p class="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">{{ $row['section'] }}</p>
                            <p class="text-sm font-semibold text-slate-800">{{ $row['topic'] }}</p>
                            <p class="text-xs text-slate-600">{{ number_format($row['avg_accuracy'], 1) }}% | {{ $row['attempts'] }} attempts</p>
                        </div>
                    @empty
                        <div class="empty-state sm:col-span-2">No heatmap records for the selected filter set.</div>
                    @endforelse
                </div>
            </article>
        </section>

        <section class="panel p-4">
            <h3 class="section-title">Decision-Support Recommendations</h3>
            <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-stagger>
                @forelse ($analytics['recommendations'] as $item)
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p class="text-xs font-bold uppercase tracking-[0.12em] {{ $item['priority'] === 'high' ? 'text-rose-700' : ($item['priority'] === 'medium' ? 'text-amber-700' : 'text-emerald-700') }}">
                            {{ $item['priority'] }} priority
                        </p>
                        <p class="mt-1 text-sm font-semibold text-slate-900">{{ $item['title'] }}</p>
                        <p class="mt-1 text-xs text-slate-600">{{ $item['detail'] }}</p>
                    </div>
                @empty
                    <div class="empty-state md:col-span-2 xl:col-span-3">No recommendations generated for the current filters.</div>
                @endforelse
            </div>
        </section>
    </div>
