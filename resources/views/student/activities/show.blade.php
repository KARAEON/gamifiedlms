<x-app-layout :title="$activity->title">
    <div class="space-y-6">
        <section class="panel p-6">
            <a href="{{ route('student.lessons.show', $activity->topic->lesson) }}" class="text-sm font-medium text-brand-600 hover:text-brand-700">&larr; Back to lesson</a>
            <div class="mt-3 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p class="section-kicker">{{ $activity->topic->lesson->title }} | {{ $activity->topic->title }}</p>
                    <h1 class="section-title">{{ $activity->title }}</h1>
                    <p class="section-copy">{{ $activity->instructions }}</p>
                </div>
                <div class="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
                    <p><span class="font-semibold">Type:</span> {{ \App\Enums\ActivityType::labels()[$activity->activity_type->value] ?? $activity->activity_type->value }}</p>
                    <p><span class="font-semibold">Questions:</span> {{ $activity->questions->count() }}</p>
                    <p><span class="font-semibold">Max Score:</span> {{ $activity->max_score }}</p>
                </div>
            </div>
        </section>

        @if ($latestAttempt)
            <section class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">Latest Attempt</h2>
                <div class="mt-3 grid gap-3 md:grid-cols-4" data-stagger>
                    <div class="rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100">
                        <p class="text-xs text-slate-500">Score</p>
                        <p class="text-xl font-semibold text-brand-700">{{ number_format($latestAttempt->score, 1) }}</p>
                    </div>
                    <div class="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-100">
                        <p class="text-xs text-slate-500">Accuracy</p>
                        <p class="text-xl font-semibold text-emerald-700">{{ number_format($latestAttempt->accuracy, 1) }}%</p>
                    </div>
                    <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                        <p class="text-xs text-slate-500">Completed</p>
                        <p class="text-sm font-semibold text-slate-700">{{ optional($latestAttempt->completed_at)->format('M d, Y h:i A') }}</p>
                    </div>
                    <div class="rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100">
                        <p class="text-xs text-slate-500">Attempt #</p>
                        <p class="text-xl font-semibold text-amber-700">{{ $latestAttempt->attempt_number }}</p>
                    </div>
                </div>
            </section>
        @endif

        <section class="panel p-5" data-no-reveal="true">
            <livewire:student.activity-player :activity="$activity" />
        </section>
    </div>
</x-app-layout>
