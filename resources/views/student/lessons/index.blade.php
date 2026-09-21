<x-app-layout title="Student Lessons">
    <div class="space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
                <h1 class="text-2xl font-semibold text-slate-900">Science Lessons</h1>
                <p class="text-sm text-slate-600">Choose a lesson and complete activities to unlock mastery badges.</p>
            </div>
        </div>

        <div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3" data-stagger>
            @forelse ($lessons as $lesson)
                @php
                    $activities = $lesson->topics->flatMap->activities;
                    $totalActivities = $activities->count();
                    $completedActivities = $activities->whereIn('id', $completedByActivity)->count();
                    $progressPercent = $totalActivities > 0 ? round(($completedActivities / $totalActivities) * 100) : 0;
                @endphp
                <article class="panel overflow-hidden">
                    <div class="border-b border-slate-100 bg-slate-50 px-5 py-4">
                        <p class="text-xs uppercase tracking-wider text-brand-600">{{ $lesson->subject }}</p>
                        <h2 class="mt-1 text-lg font-semibold text-slate-900">{{ $lesson->title }}</h2>
                        <p class="mt-1 text-sm text-slate-600">{{ $lesson->description }}</p>
                    </div>
                    <div class="p-5">
                        <div class="mb-3 flex items-center justify-between text-sm">
                            <span class="font-medium text-slate-600">Completion</span>
                            <span class="font-semibold text-brand-700">{{ $progressPercent }}%</span>
                        </div>
                        <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div class="h-full rounded-full bg-brand-500 transition-all" style="width: {{ $progressPercent }}%"></div>
                        </div>
                        <p class="mt-3 text-xs text-slate-500">{{ $completedActivities }} of {{ $totalActivities }} activities completed</p>
                        <a href="{{ route('student.lessons.show', $lesson) }}" class="btn-primary mt-4 w-full">Open Lesson</a>
                    </div>
                </article>
            @empty
                <article class="panel col-span-full p-10 text-center text-sm text-slate-500">
                    No lessons available yet.
                </article>
            @endforelse
        </div>

        <div>
            {{ $lessons->links() }}
        </div>
    </div>
</x-app-layout>
