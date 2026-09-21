<x-teacher-layout title="Instructional Workflow">
    <div class="space-y-6">
        <section class="panel p-6">
            <h1 class="text-2xl font-semibold text-slate-900">Teacher-Centered Instructional Workflow</h1>
            <p class="mt-1 text-sm text-slate-600">
                Run the cycle: teach competency, evaluate mastery, apply the 80/75 rule, reteach when needed, and monitor remediation/enrichment assignments.
            </p>
        </section>

        <section class="filter-panel">
            <div class="mb-4">
                <p class="section-kicker">Workflow Filters</p>
                <h2 class="section-title">Select Class and Competency</h2>
            </div>
            <form method="GET" action="{{ route('teacher.workflow.index') }}" class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Section</label>
                    <select name="section_id" class="input-field">
                        <option value="">Select section</option>
                        @foreach ($sections as $section)
                            <option value="{{ $section->id }}" @selected((string) $filters['section_id'] === (string) $section->id)>
                                {{ $section->name }}
                            </option>
                        @endforeach
                    </select>
                </div>
                <div class="xl:col-span-2">
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Competency (Topic)</label>
                    <select name="topic_id" class="input-field">
                        <option value="">Select competency/topic</option>
                        @foreach ($topics as $topic)
                            <option value="{{ $topic->id }}" @selected((string) $filters['topic_id'] === (string) $topic->id)>
                                {{ $topic->title }} ({{ $topic->lesson?->title }})
                            </option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Mastery Threshold</label>
                    <input type="number" min="50" max="100" step="0.01" name="mastery_threshold" value="{{ $filters['mastery_threshold'] }}" class="input-field">
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Class Attainment Threshold</label>
                    <input type="number" min="50" max="100" step="0.01" name="attainment_threshold" value="{{ $filters['attainment_threshold'] }}" class="input-field">
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">From</label>
                    <input type="date" name="date_from" value="{{ $filters['date_from'] }}" class="input-field">
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">To</label>
                    <input type="date" name="date_to" value="{{ $filters['date_to'] }}" class="input-field">
                </div>
                <div class="xl:col-span-2 flex items-end gap-2">
                    <button class="btn-primary w-full sm:w-auto">Load Snapshot</button>
                    <a href="{{ route('teacher.workflow.index') }}" class="btn-secondary w-full text-center sm:w-auto">Reset</a>
                </div>
            </form>
            @if ($resolvedPolicy)
                <p class="mt-3 text-xs text-slate-500">
                    Active policy: {{ $resolvedPolicy['name'] ?? 'Policy' }} |
                    Weights G/F/S: {{ $resolvedPolicy['gamified_weight'] }}/{{ $resolvedPolicy['formative_weight'] }}/{{ $resolvedPolicy['summative_weight'] }} |
                    Weekly summative: {{ $resolvedPolicy['weekly_summative_required'] ? 'Required' : 'Optional' }}
                </p>
            @endif
        </section>

        @if ($snapshot)
            <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article class="metric-card">
                    <p class="metric-label">Class Size</p>
                    <p class="metric-value">{{ number_format($snapshot['class_size']) }}</p>
                    <p class="mt-1 text-xs text-slate-500">{{ $snapshot['section']->name }}</p>
                </article>
                <article class="metric-card">
                    <p class="metric-label">Students Mastered</p>
                    <p class="metric-value">{{ number_format($snapshot['students_mastered']) }}</p>
                    <p class="mt-1 text-xs text-slate-500">At least {{ number_format($snapshot['mastery_threshold'], 1) }}% mastery</p>
                </article>
                <article class="metric-card">
                    <p class="metric-label">Class Attainment</p>
                    <p class="metric-value">{{ number_format($snapshot['class_attainment'], 1) }}%</p>
                    <p class="mt-1 text-xs text-slate-500">Proceed threshold: {{ number_format($snapshot['attainment_threshold'], 1) }}%</p>
                </article>
                <article class="metric-card">
                    <p class="metric-label">Weekly Summative MPS</p>
                    <p class="metric-value">{{ number_format($snapshot['weekly_summative']['mps'], 1) }}%</p>
                    <p class="mt-1 text-xs text-slate-500">
                        {{ $snapshot['weekly_summative']['attempts'] }} attempts •
                        {{ $snapshot['weekly_summative']['compliant'] ? 'Compliant' : 'Non-compliant' }}
                    </p>
                </article>
            </section>

            <section class="panel p-5">
                <div class="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p class="section-kicker">Mastery Decision Gate</p>
                        <h2 class="section-title">{{ $snapshot['topic']->title }} | {{ $snapshot['lesson']?->title }}</h2>
                        <p class="mt-1 text-sm text-slate-600">
                            Rule: Proceed only when at least 80% of class reaches at least 75% mastery.
                        </p>
                    </div>
                    <span class="badge {{ $snapshot['decision'] === 'proceed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700' }}">
                        {{ $snapshot['decision'] === 'proceed' ? 'Proceed to Next Lesson' : 'Reteach Required' }}
                    </span>
                </div>
                <form method="POST" action="{{ route('teacher.workflow.evaluate') }}" class="mt-4 grid gap-3 md:grid-cols-3">
                    @csrf
                    <input type="hidden" name="section_id" value="{{ $snapshot['section']->id }}">
                    <input type="hidden" name="topic_id" value="{{ $snapshot['topic']->id }}">
                    <input type="hidden" name="mastery_threshold" value="{{ $snapshot['mastery_threshold'] }}">
                    <input type="hidden" name="attainment_threshold" value="{{ $snapshot['attainment_threshold'] }}">
                    <input type="hidden" name="date_from" value="{{ $filters['date_from'] }}">
                    <input type="hidden" name="date_to" value="{{ $filters['date_to'] }}">
                    <p class="md:col-span-2 text-sm text-slate-600">
                        Save this evaluation to class workflow history and auto-generate remediation/enrichment assignments.
                    </p>
                    <button class="btn-primary md:justify-self-end">Evaluate and Save Cycle</button>
                </form>
            </section>

            <section class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">Learner Mastery Snapshot</h2>
                <div class="mt-4 table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Learner</th>
                                <th>Mastery %</th>
                                <th>Phase Breakdown (G/F)</th>
                                <th>Evidence Attempts</th>
                                <th>Suggested Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($snapshot['student_metrics'] as $metric)
                                <tr>
                                    <td>{{ $metric['name'] }}</td>
                                    <td>{{ number_format($metric['mastery_pct'], 1) }}%</td>
                                    <td>
                                        @php
                                            $g = $metric['phase_breakdown']['gamified'] ?? null;
                                            $f = $metric['phase_breakdown']['formative'] ?? null;
                                        @endphp
                                        G: {{ $g !== null ? number_format((float) $g, 1).'%' : '-' }} /
                                        F: {{ $f !== null ? number_format((float) $f, 1).'%' : '-' }}
                                    </td>
                                    <td>{{ $metric['attempts'] }}</td>
                                    <td>
                                        @if ($metric['intervention_type'] === 'remediation')
                                            <span class="badge border-rose-200 bg-rose-50 text-rose-700">Remediation</span>
                                        @elseif ($metric['intervention_type'] === 'enrichment')
                                            <span class="badge border-emerald-200 bg-emerald-50 text-emerald-700">Enrichment</span>
                                        @else
                                            <span class="text-slate-500">Monitor</span>
                                        @endif
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="5" class="py-6">
                                        <div class="empty-state">No learner evidence found for this competency and date range.</div>
                                    </td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </section>
        @endif

        <section class="grid gap-6 xl:grid-cols-2">
            <article class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">Recent Mastery Cycles</h2>
                <div class="mt-4 space-y-3">
                    @forelse ($recentCycles as $cycle)
                        <div class="rounded-2xl border border-slate-200 p-4">
                            <div class="flex items-start justify-between gap-3">
                                <div>
                                    <p class="text-sm font-semibold text-slate-900">{{ $cycle->section?->name }} | {{ $cycle->topic?->title }}</p>
                                    <p class="text-xs text-slate-500">
                                        {{ $cycle->topic?->lesson?->title }} • Evaluated {{ optional($cycle->evaluated_at)->format('M d, Y h:i A') }}
                                    </p>
                                </div>
                                <span class="badge {{ $cycle->decision === 'proceed' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700' }}">
                                    {{ ucfirst($cycle->decision) }}
                                </span>
                            </div>
                            <p class="mt-2 text-sm text-slate-700">
                                Attainment {{ number_format((float) $cycle->class_attainment, 1) }}%
                                ({{ $cycle->students_mastered }}/{{ $cycle->class_size }} mastered)
                            </p>
                            @if ($cycle->requires_reteach)
                                <form method="POST" action="{{ route('teacher.workflow.reteach', $cycle) }}" class="mt-3 grid gap-2">
                                    @csrf
                                    <input type="text" name="reteach_strategy" class="input-field" placeholder="Reteach strategy (e.g. scaffolded guided practice)" required>
                                    <textarea name="reteach_notes" rows="2" class="input-field" placeholder="Optional notes"></textarea>
                                    <div class="flex justify-end">
                                        <button class="btn-secondary px-3 py-2 text-xs">Log Reteach Completion</button>
                                    </div>
                                </form>
                            @endif
                        </div>
                    @empty
                        <div class="empty-state">No mastery cycles recorded yet.</div>
                    @endforelse
                </div>
            </article>

            <article class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">Remediation and Enrichment Tracking</h2>
                <div class="mt-4 space-y-3">
                    @forelse ($interventions as $intervention)
                        <div class="rounded-2xl border border-slate-200 p-4">
                            <div class="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p class="text-sm font-semibold text-slate-900">{{ $intervention->student?->name }}</p>
                                    <p class="text-xs text-slate-500">
                                        {{ $intervention->section?->name }} • {{ $intervention->topic?->title }}
                                    </p>
                                </div>
                                <span class="badge {{ $intervention->intervention_type === 'remediation' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700' }}">
                                    {{ ucfirst($intervention->intervention_type) }}
                                </span>
                            </div>
                            <p class="mt-2 text-sm text-slate-700">{{ $intervention->recommended_action }}</p>
                            <p class="mt-1 text-xs text-slate-500">{{ $intervention->reason }}</p>
                            <form method="POST" action="{{ route('teacher.workflow.interventions.update', $intervention) }}" class="mt-3 grid gap-2 sm:grid-cols-3">
                                @csrf
                                @method('PATCH')
                                <select name="status" class="input-field">
                                    <option value="assigned" @selected($intervention->status === 'assigned')>Assigned</option>
                                    <option value="in_progress" @selected($intervention->status === 'in_progress')>In Progress</option>
                                    <option value="completed" @selected($intervention->status === 'completed')>Completed</option>
                                </select>
                                <input type="text" name="notes" class="input-field sm:col-span-2" value="{{ $intervention->notes }}" placeholder="Progress notes">
                                <div class="sm:col-span-3 flex justify-end">
                                    <button class="btn-secondary px-3 py-2 text-xs">Update Intervention</button>
                                </div>
                            </form>
                        </div>
                    @empty
                        <div class="empty-state">No intervention assignments yet. Save a mastery cycle to auto-generate them.</div>
                    @endforelse
                </div>
            </article>
        </section>
    </div>
</x-teacher-layout>
