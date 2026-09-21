<x-app-layout title="Admin Reports">
    <div class="space-y-6">
        <section class="panel p-6">
            <h1 class="text-2xl font-semibold text-slate-900">Admin Report Workspace</h1>
            <p class="mt-1 text-sm text-slate-600">
                Download school analytics reports by scope and log official submissions for decision and compliance tracking.
            </p>
        </section>

        <section class="grid gap-6 xl:grid-cols-2">
            <article class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">Download Analytics Report</h2>
                <form method="POST" action="{{ route('admin.reports.download') }}" class="mt-4 grid gap-3">
                    @csrf
                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Report Scope</label>
                        <select name="report_scope" class="input-field" required>
                            <option value="subject">Subject Performance</option>
                            <option value="class">Class Performance</option>
                            <option value="teacher">Teacher Summary</option>
                            <option value="quarterly">Quarterly Performance</option>
                        </select>
                    </div>
                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Output Format</label>
                        <select name="format" class="input-field">
                            <option value="csv">CSV</option>
                            <option value="pdf">PDF</option>
                            <option value="view">Preview in Browser</option>
                        </select>
                    </div>
                    <div class="grid gap-3 md:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">From</label>
                            <input type="date" name="date_from" class="input-field">
                        </div>
                        <div>
                            <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">To</label>
                            <input type="date" name="date_to" class="input-field">
                        </div>
                    </div>
                    <div class="grid gap-3 md:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Section (Optional)</label>
                            <select name="section_id" class="input-field">
                                <option value="">All sections</option>
                                @foreach ($sections as $section)
                                    <option value="{{ $section->id }}">{{ $section->name }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div>
                            <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Teacher (Optional)</label>
                            <select name="teacher_id" class="input-field">
                                <option value="">All teachers</option>
                                @foreach ($teachers as $teacher)
                                    <option value="{{ $teacher->id }}">{{ $teacher->name }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>
                    <input type="text" name="subject" class="input-field" placeholder="Subject filter (optional)">
                    <input type="text" name="grade_keyword" class="input-field" placeholder="Grade keyword filter (optional)">
                    <div class="flex justify-end">
                        <button class="btn-primary">Download CSV</button>
                    </div>
                </form>
            </article>

            <article class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">Log Report Submission</h2>
                <form method="POST" action="{{ route('admin.reports.submit') }}" class="mt-4 grid gap-3">
                    @csrf
                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Report Scope</label>
                        <select name="report_scope" class="input-field" required>
                            <option value="subject">Subject</option>
                            <option value="class">Class</option>
                            <option value="teacher">Teacher</option>
                            <option value="quarterly">Quarterly</option>
                        </select>
                    </div>
                    <input type="text" name="scope_reference" class="input-field" placeholder="Scope reference (e.g. Grade 6 Science Q1)">
                    <div class="grid gap-3 md:grid-cols-2">
                        <input type="date" name="date_from" class="input-field">
                        <input type="date" name="date_to" class="input-field">
                    </div>
                    <input type="text" name="destination" class="input-field" placeholder="Destination (e.g. Division Office)">
                    <textarea name="remarks" rows="3" class="input-field" placeholder="Submission remarks"></textarea>
                    <div class="flex justify-end">
                        <button class="btn-primary">Log Submission</button>
                    </div>
                </form>
            </article>
        </section>

        <section class="panel p-5">
            <h2 class="text-lg font-semibold text-slate-900">Submission History</h2>
            <div class="mt-4 table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Scope</th>
                            <th>Reference</th>
                            <th>Date Window</th>
                            <th>Destination</th>
                            <th>Status</th>
                            <th>Submitted By</th>
                            <th>Submitted At</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($submissions as $submission)
                            <tr>
                                <td>{{ ucfirst($submission->report_scope) }}</td>
                                <td>{{ $submission->scope_reference ?: '-' }}</td>
                                <td>
                                    @if ($submission->date_from || $submission->date_to)
                                        {{ optional($submission->date_from)->format('M d, Y') ?? '-' }} to {{ optional($submission->date_to)->format('M d, Y') ?? '-' }}
                                    @else
                                        -
                                    @endif
                                </td>
                                <td>{{ $submission->destination ?: '-' }}</td>
                                <td>
                                    <span class="badge {{ $submission->status === 'submitted' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-700' }}">
                                        {{ ucfirst($submission->status) }}
                                    </span>
                                </td>
                                <td>{{ $submission->submitter?->name ?? 'Unknown' }}</td>
                                <td>{{ optional($submission->submitted_at)->format('M d, Y h:i A') ?? '-' }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="py-6"><div class="empty-state">No report submissions logged yet.</div></td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <div class="mt-4">
                {{ $submissions->links() }}
            </div>
        </section>

        <section class="panel p-5">
            <h2 class="text-lg font-semibold text-slate-900">Teacher Submissions to School Head</h2>
            <div class="mt-4 table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Report</th>
                            <th>Teacher</th>
                            <th>Type</th>
                            <th>Target</th>
                            <th>Status</th>
                            <th>Teacher Note</th>
                            <th>Submitted At</th>
                            <th>Acknowledge</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($teacherReportSubmissions as $delivery)
                            <tr>
                                <td class="font-semibold text-slate-800">{{ $delivery->report?->title ?? 'Unknown Report' }}</td>
                                <td>{{ $delivery->submitter?->name ?? ($delivery->report?->teacher?->name ?? 'Unknown Teacher') }}</td>
                                <td>{{ ucfirst($delivery->report?->report_type ?? '-') }}</td>
                                <td>
                                    @if ($delivery->report?->student)
                                        Student: {{ $delivery->report->student->name }}
                                    @elseif ($delivery->report?->section)
                                        Section: {{ $delivery->report->section->name }}
                                    @else
                                        System Summary
                                    @endif
                                </td>
                                <td>
                                    <span class="badge {{ $delivery->status === 'submitted' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700' }}">
                                        {{ ucfirst($delivery->status) }}
                                    </span>
                                </td>
                                <td>{{ \Illuminate\Support\Str::limit($delivery->teacher_note ?? '-', 60) }}</td>
                                <td>{{ optional($delivery->submitted_at)->format('M d, Y h:i A') ?? '-' }}</td>
                                <td>
                                    @if ($delivery->status === 'submitted')
                                        <form method="POST" action="{{ route('admin.reports.teacher_submissions.acknowledge', $delivery) }}" class="space-y-2">
                                            @csrf
                                            @method('PATCH')
                                            <input type="text" name="admin_note" class="input-field" placeholder="Optional acknowledgement note">
                                            <button class="btn-secondary px-3 py-2 text-xs">Acknowledge</button>
                                        </form>
                                    @else
                                        <p class="text-xs text-slate-500">By: {{ $delivery->acknowledger?->name ?? 'Admin' }}</p>
                                        <p class="text-xs text-slate-500">{{ optional($delivery->acknowledged_at)->format('M d, Y h:i A') }}</p>
                                    @endif
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="8" class="py-6"><div class="empty-state">No teacher submissions yet.</div></td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <div class="mt-4">
                {{ $teacherReportSubmissions->links() }}
            </div>
        </section>
    </div>
</x-app-layout>
