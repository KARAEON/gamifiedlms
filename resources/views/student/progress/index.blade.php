<x-app-layout title="My Progress">
    @php
        $trendLabels = $trend->pluck('date')->map(fn ($value) => \Illuminate\Support\Carbon::parse($value)->format('M d'));
        $trendValues = $trend->pluck('accuracy');
        $topicLabels = $topicProgress->pluck('topic.title');
        $topicValues = $topicProgress->pluck('avg_accuracy');
    @endphp

    <div class="space-y-6">
        <div class="panel p-6">
            <h1 class="text-2xl font-semibold text-slate-900">My Progress History</h1>
            <p class="mt-1 text-sm text-slate-600">Review your score trends and mastery by topic.</p>
        </div>

        <div class="grid gap-6 lg:grid-cols-2" data-stagger>
            <section class="panel p-5">
                <h2 class="mb-4 text-lg font-semibold text-slate-900">Score Trend</h2>
                @if ($trend->isEmpty())
                    <p class="text-sm text-slate-500">No progress data yet.</p>
                @else
                    <canvas id="score-trend-chart" height="130"></canvas>
                @endif
            </section>

            <section class="panel p-5">
                <h2 class="mb-4 text-lg font-semibold text-slate-900">Topic Mastery</h2>
                @if ($topicProgress->isEmpty())
                    <p class="text-sm text-slate-500">No topic records yet.</p>
                @else
                    <canvas id="topic-mastery-chart" height="130"></canvas>
                @endif
            </section>
        </div>

        <section class="panel p-5">
            <h2 class="mb-4 text-lg font-semibold text-slate-900">Topic Breakdown</h2>
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th scope="col">Lesson</th>
                            <th scope="col">Topic</th>
                            <th scope="col">Average Accuracy</th>
                            <th scope="col">Attempts</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($topicProgress as $topic)
                            <tr>
                                <td class="py-3">{{ $topic->topic?->lesson?->title }}</td>
                                <td class="py-3">{{ $topic->topic?->title }}</td>
                                <td class="py-3">{{ number_format($topic->avg_accuracy, 1) }}%</td>
                                <td class="py-3">{{ $topic->attempts }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="4" class="py-6">
                                    <div class="empty-state">No topic data yet.</div>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </section>
    </div>

    @if ($trend->isNotEmpty() || $topicProgress->isNotEmpty())
        @push('scripts')
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script>
                const mountProgressCharts = () => {
                    window.glmsRenderChartOnView('score-trend-chart', (canvas) => {
                        window.glmsBuildChart(canvas, {
                            type: 'line',
                            data: {
                                labels: @json($trendLabels),
                                datasets: [{
                                    label: 'Accuracy',
                                    data: @json($trendValues),
                                    borderColor: '#355b8d',
                                    backgroundColor: 'rgba(79, 113, 159, 0.14)',
                                    fill: true,
                                    pointRadius: 2.5,
                                    pointHoverRadius: 4,
                                    tension: 0.3,
                                }]
                            },
                            options: {
                                plugins: {
                                    legend: {
                                        display: false,
                                    },
                                },
                                scales: {
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#64748b' },
                                    },
                                    y: {
                                        beginAtZero: true,
                                        max: 100,
                                        grid: { color: 'rgba(100,116,139,0.16)' },
                                        ticks: { color: '#64748b', callback: (value) => `${value}%` },
                                    },
                                }
                            }
                        });
                    });

                    window.glmsRenderChartOnView('topic-mastery-chart', (canvas) => {
                        window.glmsBuildChart(canvas, {
                            type: 'bar',
                            data: {
                                labels: @json($topicLabels),
                                datasets: [{
                                    label: 'Average Accuracy',
                                    data: @json($topicValues),
                                    backgroundColor: 'rgba(34,160,90,0.7)',
                                    borderRadius: 10,
                                }]
                            },
                            options: {
                                plugins: {
                                    legend: {
                                        display: false,
                                    },
                                },
                                scales: {
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#64748b' },
                                    },
                                    y: {
                                        beginAtZero: true,
                                        max: 100,
                                        grid: { color: 'rgba(100,116,139,0.16)' },
                                        ticks: { color: '#64748b', callback: (value) => `${value}%` },
                                    },
                                }
                            }
                        });
                    });
                };

                if (typeof window.glmsRenderChartOnView === 'function' && typeof window.glmsBuildChart === 'function') {
                    mountProgressCharts();
                } else {
                    window.addEventListener('DOMContentLoaded', mountProgressCharts, { once: true });
                }
            </script>
        @endpush
    @endif
</x-app-layout>



