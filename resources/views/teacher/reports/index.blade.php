<x-app-layout title="Reports">
    <div class="space-y-6" x-data="{ reportType: '{{ old('report_type', 'student') }}' }">
        <x-staff.page-heading title="Reports" description="Review generated reports and share learning evidence with your School Head." eyebrow="Teaching and learning">
<button type="button" class="btn-primary" data-open-dialog="generate-report">Generate New Report</button>
</x-staff.page-heading>



        <section class="panel p-5">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p class="section-kicker">Report History</p>
                    <h3 class="section-title">Recent Generated Reports</h3>
                </div>
            </div>
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Target</th>
                            <th>Generated At</th>
                            <th>School Head Status</th>
                            <th>Remarks</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($reports as $report)
                            @php
                                $delivery = $report->latestSchoolHeadDelivery;
                                $deliveryStatus = $delivery?->status;
                            @endphp
                            <tr>
                                <td class="font-semibold text-slate-800">{{ $report->title }}</td>
                                <td>{{ ucfirst($report->report_type) }}</td>
                                <td>
                                    @if ($report->student)
                                        Student: {{ $report->student->name }}
                                    @elseif ($report->section)
                                        Section: {{ $report->section->name }}
                                    @else
                                        System Summary
                                    @endif
                                </td>
                                <td>{{ optional($report->generated_at)->format('M d, Y h:i A') }}</td>
                                <td>
                                    @if ($deliveryStatus === 'submitted')
                                        <span class="badge border-amber-200 bg-amber-50 text-amber-700">Submitted</span>
                                        <p class="mt-1 text-xs text-slate-500">{{ optional($delivery?->submitted_at)->format('M d, Y h:i A') }}</p>
                                    @elseif ($deliveryStatus === 'acknowledged')
                                        <span class="badge border-emerald-200 bg-emerald-50 text-emerald-700">Acknowledged</span>
                                        <p class="mt-1 text-xs text-slate-500">{{ optional($delivery?->acknowledged_at)->format('M d, Y h:i A') }}</p>
                                    @else
                                        <span class="badge border-slate-200 bg-slate-50 text-slate-700">Not Submitted</span>
                                    @endif
                                </td>
                                <td>{{ \Illuminate\Support\Str::limit($report->remarks ?? '-', 70) }}</td>
                                <td>
                                    <button type="button" class="btn-secondary" data-open-dialog="submit-report-{{ $report->id }}" @disabled($deliveryStatus === 'submitted')>{{ $deliveryStatus === 'submitted' ? 'Awaiting review' : 'Submit to School Head' }}</button>
                                    <x-staff.dialog id="submit-report-{{ $report->id }}" title="Submit report to School Head">
                                        <p class="mb-4 text-sm">{{ $report->title }}</p><form method="POST" action="{{ route('teacher.reports.submit_school_head', $report) }}" class="space-y-2">
                                        @csrf
                                        <input type="text" name="teacher_note" class="input-field" placeholder="Optional note to school head">
                                        <button class="btn-secondary px-3 py-2 text-xs" @disabled($deliveryStatus === 'submitted')>
                                            {{ $deliveryStatus === 'submitted' ? 'Awaiting Review' : 'Submit to School Head' }}
                                        </button>
                                    </form></x-staff.dialog>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="7" class="text-center text-slate-500">No reports generated yet.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            <div class="mt-4">
                {{ $reports->links() }}
            </div>
        </section>
    </div>

<details class="panel p-5"><summary class="font-semibold">Report guidance</summary>
                <h3 class="section-title">Report Quality Checklist</h3>
                <ul class="mt-3 space-y-2 text-sm text-slate-700">
                    <li class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">Use at least a 30-day range for stronger trend reliability.</li>
                    <li class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">For interventions, review high risk topics and low-score rates together.</li>
                    <li class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">Use PDF for formal presentations and CSV for spreadsheet modeling.</li>
                    <li class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">Add teacher remarks to guide remediation and enrichment planning.</li>
                </ul>
            </details>
<x-staff.dialog id="generate-report" title="Generate New Report">


                <p class="section-copy">Select report scope, filters, and output type.</p>
                @if ($errors->any())
                    <div class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                        <p class="font-semibold">Please fix the following before generating:</p>
                        <ul class="mt-2 list-disc pl-5">
                            @foreach ($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif
                <form method="POST" action="{{ route('teacher.reports.generate') }}" class="mt-4 space-y-3">
                    @csrf
                    <div class="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Report Type</label>
                            <select name="report_type" class="input-field" x-model="reportType" required>
                                <option value="student" @selected(old('report_type') === 'student')>Individual Student</option>
                                <option value="section" @selected(old('report_type') === 'section')>Section/Class</option>
                                <option value="summary" @selected(old('report_type') === 'summary')>Summary Analytics</option>
                            </select>
                        </div>
                        <div>
                            <label class="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Output Format</label>
                            <select name="format" class="input-field" required>
                                <option value="view" @selected(old('format') === 'view')>Preview</option>
                                <option value="pdf" @selected(old('format') === 'pdf')>PDF</option>
                                <option value="csv" @selected(old('format') === 'csv')>CSV</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid gap-3 sm:grid-cols-2">
                        <div x-show="reportType === 'student'" x-cloak>
                            <label class="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Student</label>
                            <select name="student_id" class="input-field" x-bind:required="reportType === 'student'">
                                <option value="">Select student</option>
                                @foreach ($students as $student)
                                    <option value="{{ $student->id }}" @selected((string) old('student_id') === (string) $student->id)>{{ $student->name }}</option>
                                @endforeach
                            </select>
                        </div>
                        <div x-show="reportType === 'section'" x-cloak>
                            <label class="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Section</label>
                            <select name="section_id" class="input-field" x-bind:required="reportType === 'section'">
                                <option value="">Select section</option>
                                @foreach ($sections as $section)
                                    <option value="{{ $section->id }}" @selected((string) old('section_id') === (string) $section->id)>{{ $section->name }}</option>
                                @endforeach
                            </select>
                        </div>
                    </div>

                    <div class="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Date From</label>
                            <input type="date" name="date_from" value="{{ old('date_from') }}" class="input-field">
                        </div>
                        <div>
                            <label class="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Date To</label>
                            <input type="date" name="date_to" value="{{ old('date_to') }}" class="input-field">
                        </div>
                    </div>

                    <button class="btn-primary w-full sm:w-auto">Generate Report</button>
                </form>

</x-staff.dialog>
</x-app-layout>
