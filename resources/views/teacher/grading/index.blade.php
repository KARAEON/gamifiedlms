<x-app-layout title="Student Grading">
    <div class="space-y-6">
        <section class="panel p-6">
            <h1 class="text-2xl font-semibold text-slate-900">Student Grading</h1>
            <p class="mt-1 text-sm text-slate-600">Written Works are automatic from game scores. Enter Performance Task and Quarterly Assessment values below.</p>
            @if (! \Illuminate\Support\Facades\Schema::hasTable('grade_entries'))
                <div class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    The grading table is not created yet. Teacher entries cannot be saved until the <code>grade_entries</code> table exists.
                </div>
            @endif
        </section>

        <section class="filter-panel">
            <form method="GET" action="{{ route('teacher.grading.index') }}" class="grid gap-3 md:grid-cols-4">
                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Section</label>
                    <select name="section_id" class="input-field">
                        @foreach ($sections as $section)
                            <option value="{{ $section->id }}" @selected((int) $selectedSectionId === (int) $section->id)>{{ $section->name }}</option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Subject</label>
                    <select name="subject" class="input-field">
                        @foreach ($subjects as $subject)
                            <option value="{{ $subject }}" @selected($selectedSubject === $subject)>{{ $subject }}</option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Quarter</label>
                    <select name="quarter" class="input-field">
                        @foreach ([1, 2, 3, 4] as $quarter)
                            <option value="{{ $quarter }}" @selected((int) $selectedQuarter === $quarter)>Quarter {{ $quarter }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="flex items-end">
                    <button type="submit" class="btn-primary w-full">Apply</button>
                </div>
            </form>
        </section>

        <section class="panel p-5" data-no-reveal="true">
            <div class="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Manual grading for <strong>Performance Tasks</strong> is itemized below. Enter up to 10 items and their HPS values. The system will compute <strong>Total</strong>, <strong>PS</strong>, and <strong>WS</strong> automatically.
            </div>
            <div class="table-wrap" data-no-reveal="true">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>WW Total</th>
                            <th>WW HPS</th>
                            <th>WW PS</th>
                            <th colspan="13">Performance Tasks ({{ (int) (($selectedSubject === 'Mathematics' ? 0.60 : 0.40) * 100) }}%)</th>
                            <th>QA Score</th>
                            <th>QA HPS</th>
                            <th>Quarterly Grade</th>
                            <th>Action</th>
                        </tr>
                        <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                            @foreach (range(1, 10) as $ptNumber)
                                <th>{{ $ptNumber }}</th>
                            @endforeach
                            <th>Total</th>
                            <th>PS</th>
                            <th>WS</th>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($gradeRows as $row)
                            <tr>
                                <td class="py-3">{{ $row['student']->name }}</td>
                                <td class="py-3">{{ $row['computed']['written_works']['total'] ?? '—' }}</td>
                                <td class="py-3">{{ $row['computed']['written_works']['hps_total'] ?? '—' }}</td>
                                <td class="py-3">{{ $row['computed']['written_works']['percentage_score'] !== null ? number_format($row['computed']['written_works']['percentage_score'], 2).'%' : '—' }}</td>
                                <td colspan="13" class="py-3">
                                    <form method="POST" action="{{ route('teacher.grading.store') }}" class="grid gap-2">
                                        @csrf
                                        <input type="hidden" name="student_id" value="{{ $row['student']->id }}">
                                        <input type="hidden" name="section_id" value="{{ $selectedSectionId }}">
                                        <input type="hidden" name="subject" value="{{ $selectedSubject }}">
                                        <input type="hidden" name="quarter" value="{{ $selectedQuarter }}">
                                        @php
                                            $ptItems = $row['computed']['performance_task_items'] ?? array_fill(0, 10, null);
                                            $ptHpsItems = $row['computed']['performance_task_hps_items'] ?? array_fill(0, 10, null);
                                        @endphp
                                        <div class="grid grid-cols-13 gap-2">
                                            @foreach (range(0, 9) as $index)
                                                <input type="number" step="0.01" min="0" name="performance_task_items[]" value="{{ old('performance_task_items.'.$index, $ptItems[$index] ?? null) }}" class="input-field" placeholder="{{ $index + 1 }}">
                                            @endforeach
                                            <div class="input-field flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-700">{{ $row['computed']['performance_tasks']['total'] !== null ? number_format((float) $row['computed']['performance_tasks']['total'], 2) : '—' }}</div>
                                            <div class="input-field flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-700">{{ $row['computed']['performance_tasks']['percentage_score'] !== null ? number_format((float) $row['computed']['performance_tasks']['percentage_score'], 2) : '—' }}</div>
                                            <div class="input-field flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-700">{{ $row['computed']['performance_tasks']['weighted_score'] !== null ? number_format((float) $row['computed']['performance_tasks']['weighted_score'], 2) : '—' }}</div>
                                        </div>
                                        <div class="mt-2 grid grid-cols-13 gap-2">
                                            @foreach (range(0, 9) as $index)
                                                <input type="number" step="0.01" min="0" name="performance_task_hps_items[]" value="{{ old('performance_task_hps_items.'.$index, $ptHpsItems[$index] ?? null) }}" class="input-field" placeholder="HPS {{ $index + 1 }}">
                                            @endforeach
                                            <div class="input-field flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-700">{{ $row['computed']['performance_tasks']['hps_total'] !== null ? number_format((float) $row['computed']['performance_tasks']['hps_total'], 2) : '—' }}</div>
                                            <div class="input-field flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500">PS</div>
                                            <div class="input-field flex items-center justify-center bg-slate-50 text-xs font-semibold text-slate-500">WS</div>
                                        </div>
                                </td>
                                <td class="py-3">
                                        <input type="number" step="0.01" min="0" name="quarterly_assessment_score" value="{{ old('quarterly_assessment_score', $row['entry']?->quarterly_assessment_score) }}" class="input-field" placeholder="QA Score">
                                </td>
                                <td class="py-3">
                                        <input type="number" step="0.01" min="0" name="quarterly_assessment_hps" value="{{ old('quarterly_assessment_hps', $row['entry']?->quarterly_assessment_hps) }}" class="input-field" placeholder="QA HPS">
                                </td>
                                <td class="py-3">{{ $row['computed']['quarterly_grade'] ?? '—' }}</td>
                                <td class="py-3">
                                        <button type="submit" class="btn-primary whitespace-nowrap">Save</button>
                                    </form>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="10" class="py-6"><div class="empty-state">No students found for the current grading scope.</div></td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</x-app-layout>
