<x-app-layout title="School Analytics Dashboard">
    <div class="space-y-6">
        <section class="panel-hero p-6">
            <div class="absolute -right-16 -top-14 h-40 w-40 rounded-full bg-white/10"></div>
            <div class="relative z-10">
            <h1 class="text-3xl font-semibold text-white">Admin / School Head Analytics</h1>
            <p class="mt-1 max-w-3xl text-sm text-blue-100">
                Review school-wide MPS, class and teacher summaries, competency strengths/gaps, and quarterly signals for intervention planning.
            </p>
            </div>
        </section>

        <section class="filter-panel">
            <div class="mb-4">
                <p class="section-kicker">Scope Controls</p>
                <h2 class="section-title">School and Class Filters</h2>
            </div>
            <form method="GET" action="{{ route('admin.dashboard') }}" class="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
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
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Teacher</label>
                    <select name="teacher_id" class="input-field">
                        <option value="">All teachers</option>
                        @foreach ($teachers as $teacher)
                            <option value="{{ $teacher->id }}" @selected((string) $filters['teacher_id'] === (string) $teacher->id)>
                                {{ $teacher->name }}
                            </option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Subject</label>
                    <select name="subject" class="input-field">
                        <option value="">All subjects</option>
                        @foreach ($subjects as $subject)
                            <option value="{{ $subject }}" @selected((string) $filters['subject'] === (string) $subject)>{{ $subject }}</option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Grade Keyword</label>
                    <input type="text" name="grade_keyword" value="{{ $filters['grade_keyword'] }}" class="input-field" placeholder="Grade 6">
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
                    <button class="btn-primary w-full sm:w-auto">Apply</button>
                    <a href="{{ route('admin.dashboard') }}" class="btn-secondary w-full text-center sm:w-auto">Reset</a>
                </div>
            </form>
        </section>

        <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" data-stagger>
            <article class="metric-card">
                <p class="metric-label">Total Students</p>
                <p class="metric-value">{{ number_format($analytics['overview']['total_students']) }}</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Total Teachers</p>
                <p class="metric-value">{{ number_format($analytics['overview']['total_teachers']) }}</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Total Sections</p>
                <p class="metric-value">{{ number_format($analytics['overview']['total_sections']) }}</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">School MPS</p>
                <p class="metric-value">{{ number_format($analytics['overview']['overall_mps'], 1) }}%</p>
            </article>
            <article class="metric-card">
                <p class="metric-label">Weekly Summative Compliance</p>
                <p class="metric-value">{{ number_format($analytics['overview']['weekly_summative_compliance'], 1) }}%</p>
            </article>
        </section>

        <section class="grid gap-6 xl:grid-cols-2">
            <article class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">Class Performance Analytics</h2>
                <div class="mt-4 table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Class</th>
                                <th>Grade</th>
                                <th>MPS</th>
                                <th>Attainment</th>
                                <th>Learners</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($analytics['class_performance'] as $row)
                                <tr>
                                    <td>{{ $row['section'] }}</td>
                                    <td>{{ $row['grade'] }}</td>
                                    <td>{{ number_format($row['mps'], 1) }}%</td>
                                    <td>{{ number_format($row['attainment'], 1) }}%</td>
                                    <td>{{ $row['learners'] }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="5" class="py-6"><div class="empty-state">No class performance data for selected filters.</div></td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </article>

            <article class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">Teacher Summaries</h2>
                <div class="mt-4 table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Teacher</th>
                                <th>MPS</th>
                                <th>Learners</th>
                                <th>Attempts</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($analytics['teacher_summaries'] as $row)
                                <tr>
                                    <td>{{ $row['teacher'] }}</td>
                                    <td>{{ number_format($row['mps'], 1) }}%</td>
                                    <td>{{ $row['learners'] }}</td>
                                    <td>{{ $row['attempts'] }}</td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="4" class="py-6"><div class="empty-state">No teacher summary data available.</div></td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </article>
        </section>

        <section class="grid gap-6 xl:grid-cols-2">
            <article class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">Weak Competencies</h2>
                <div class="mt-4 space-y-2">
                    @forelse ($analytics['weak_competencies'] as $item)
                        <div class="apple-stat-item apple-tint-rose">
                            <p class="text-sm font-semibold text-slate-900">{{ $item['competency'] }}</p>
                            <p class="text-xs text-slate-600">{{ $item['lesson'] }} • MPS {{ number_format($item['mps'], 1) }}%</p>
                        </div>
                    @empty
                        <div class="empty-state">No weak competency detected for this scope.</div>
                    @endforelse
                </div>
            </article>

            <article class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">Mastered Competencies</h2>
                <div class="mt-4 space-y-2">
                    @forelse ($analytics['mastered_competencies'] as $item)
                        <div class="apple-stat-item apple-tint-emerald">
                            <p class="text-sm font-semibold text-slate-900">{{ $item['competency'] }}</p>
                            <p class="text-xs text-slate-600">{{ $item['lesson'] }} • MPS {{ number_format($item['mps'], 1) }}%</p>
                        </div>
                    @empty
                        <div class="empty-state">No mastered competency records in this filter scope.</div>
                    @endforelse
                </div>
            </article>
        </section>

        <section class="panel p-5">
            <h2 class="text-lg font-semibold text-slate-900">Quarterly Performance</h2>
            <div class="mt-4 table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Quarter</th>
                            <th>MPS</th>
                            <th>Learners</th>
                            <th>Attempts</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($analytics['quarterly'] as $row)
                            <tr>
                                <td>{{ $row['period'] }}</td>
                                <td>{{ number_format($row['mps'], 1) }}%</td>
                                <td>{{ $row['learners'] }}</td>
                                <td>{{ $row['attempts'] }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="4" class="py-6"><div class="empty-state">No quarterly records available.</div></td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</x-app-layout>
