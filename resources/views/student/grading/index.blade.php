<x-app-layout title="My Grading">
    <div class="space-y-6">
        <section class="panel p-6">
            <h1 class="text-2xl font-semibold text-slate-900">My Grading</h1>
            <p class="mt-1 text-sm text-slate-600">Written Works are computed automatically from your game scores. Performance Tasks and Quarterly Assessment are entered by your teacher.</p>
            <p class="mt-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">Current school quarter: Q{{ $currentQuarter }}</p>
        </section>

        @foreach ($subjects as $subject)
            <section class="panel p-5">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-xl font-semibold text-slate-900">{{ $subject['subject'] }}</h2>
                </div>

                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Quarter</th>
                                <th>WW</th>
                                <th>PT</th>
                                <th>QA</th>
                                <th>Initial Grade</th>
                                <th>Quarterly Grade</th>
                                <th>Final Grade</th>
                                <th>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($subject['quarters'] as $quarter => $payload)
                                <tr @class(['bg-brand-50/70' => (int) $quarter === $currentQuarter]) data-quarter="{{ $quarter }}" @if ((int) $quarter === $currentQuarter) data-current-quarter="true" @endif>
                                    <td class="py-3">Q{{ $quarter }} @if ((int) $quarter === $currentQuarter)<span class="ml-1 rounded bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">Current</span>@endif</td>
                                    <td class="py-3">{{ $payload['written_works']['percentage_score'] !== null ? number_format($payload['written_works']['percentage_score'], 2).'%' : '—' }}</td>
                                    <td class="py-3">{{ $payload['performance_tasks']['percentage_score'] !== null ? number_format($payload['performance_tasks']['percentage_score'], 2).'%' : '—' }}</td>
                                    <td class="py-3">{{ $payload['quarterly_assessment']['percentage_score'] !== null ? number_format($payload['quarterly_assessment']['percentage_score'], 2).'%' : '—' }}</td>
                                    <td class="py-3">{{ $payload['initial_grade'] !== null ? number_format($payload['initial_grade'], 2) : '—' }}</td>
                                    <td class="py-3">{{ $payload['quarterly_grade'] ?? '—' }}</td>
                                    <td class="py-3">{{ $payload['yearly_summary']['final_grade'] ?? '—' }}</td>
                                    <td class="py-3">{{ $payload['yearly_summary']['remark'] ?? '—' }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </section>
        @endforeach
    </div>
</x-app-layout>
