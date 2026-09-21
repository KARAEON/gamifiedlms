<x-app-layout :title="$lesson->title">
    <div class="space-y-6">
        <div class="panel p-6">
            <a href="{{ route('student.lessons.index') }}" class="text-sm font-medium text-brand-600 hover:text-brand-700">&larr; Back to lessons</a>
            <h1 class="mt-2 text-2xl font-semibold text-slate-900">{{ $lesson->title }}</h1>
            <p class="mt-2 text-sm text-slate-600">{{ $lesson->description }}</p>
        </div>

        <div class="space-y-5" data-stagger>
            @forelse ($lesson->topics as $topic)
                <section class="panel p-5">
                    <div class="mb-4">
                        <h2 class="text-lg font-semibold text-slate-900">{{ $topic->title }}</h2>
                        <p class="text-sm text-slate-600">{{ $topic->summary }}</p>
                    </div>

                    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-stagger>
                        @forelse ($topic->activities as $activity)
                            @php
                                $isCompleted = $completedByActivity->contains($activity->id);
                            @endphp
                            <article class="rounded-xl border border-slate-200 p-4 transition hover:border-brand-300 hover:bg-brand-50">
                                <div class="flex items-start justify-between gap-3">
                                    <h3 class="text-sm font-semibold text-slate-900">{{ $activity->title }}</h3>
                                    @if ($isCompleted)
                                        <span class="badge bg-emerald-100 text-emerald-700">Completed</span>
                                    @else
                                        <span class="badge bg-amber-100 text-amber-700">Pending</span>
                                    @endif
                                </div>
                                <p class="mt-2 text-xs text-slate-600">{{ $activity->instructions }}</p>
                                <p class="mt-2 text-xs text-slate-500">{{ $activity->questions_count }} questions</p>
                                <a href="{{ route('student.activities.show', $activity) }}" class="btn-primary mt-4 w-full">
                                    {{ $isCompleted ? 'Review / Retry' : 'Start Activity' }}
                                </a>
                            </article>
                        @empty
                            <p class="text-sm text-slate-500">No active activities in this topic.</p>
                        @endforelse
                    </div>
                </section>
            @empty
                <section class="panel p-10 text-center text-sm text-slate-500">
                    No topics published for this lesson yet.
                </section>
            @endforelse
        </div>
    </div>
</x-app-layout>
