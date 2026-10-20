<x-app-layout :title="$section->name">
    <div class="space-y-6">
        <section class="panel p-6">
            <a href="{{ route('teacher.sections.index') }}" class="text-sm font-medium text-brand-600 hover:text-brand-700">&larr; Back to sections</a>
            <div class="mt-3 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-semibold text-slate-900">{{ $section->name }}</h1>
                    <p class="mt-1 text-sm text-slate-600">Join Code: <span class="font-semibold">{{ $section->code }}</span></p>
                    <p class="mt-1 text-sm text-slate-600">{{ $section->description }}</p>
                </div>
                <span class="badge {{ $section->is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700' }}">
                    {{ $section->is_active ? 'Active' : 'Inactive' }}
                </span>
            </div>
        <button type="button" class="btn-secondary mt-4" data-open-dialog="edit-sections">Edit section</button></section>

        <section class="grid gap-4 md:grid-cols-3">
            <article class="metric-card">
                <p class="text-xs uppercase tracking-wide text-slate-500">Students</p>
                <p class="mt-2 text-3xl font-semibold text-slate-900">{{ $section->students->count() }}</p>
            </article>
            <article class="metric-card">
                <p class="text-xs uppercase tracking-wide text-slate-500">Average Accuracy</p>
                <p class="mt-2 text-3xl font-semibold text-brand-700">{{ number_format((float) ($scoreSummary->average_accuracy ?? 0), 1) }}%</p>
            </article>
            <article class="metric-card">
                <p class="text-xs uppercase tracking-wide text-slate-500">Total Attempts</p>
                <p class="mt-2 text-3xl font-semibold text-slate-900">{{ (int) ($scoreSummary->total_attempts ?? 0) }}</p>
            </article>
        </section>

        <section class="panel p-5">
            <h2 class="text-lg font-semibold text-slate-900">Topic Performance</h2>
            <div class="table-wrap mt-4">
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
                        @forelse ($topicBreakdown as $topic)
                            <tr>
                                <td class="py-3">{{ $topic->topic?->lesson?->title }}</td>
                                <td class="py-3">{{ $topic->topic?->title }}</td>
                                <td class="py-3">{{ number_format($topic->avg_accuracy, 1) }}%</td>
                                <td class="py-3">{{ $topic->attempts }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="4" class="py-6">
                                    <div class="empty-state">No performance data yet for this section.</div>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </section>

        <section class="panel p-5">
            @php
                $selectedLockedMajors = collect(old('locked_majors', $lockedMajorKeys))->map(fn ($majorKey) => (string) $majorKey)->all();
                $selectedLockedLessons = collect(old('locked_lessons', $lockedLessonKeys))->map(fn ($lessonKey) => (string) $lessonKey)->all();
            @endphp
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 class="text-lg font-semibold text-slate-900">Mini Game Map Access</h2>
                    <p class="mt-1 text-sm text-slate-600">Control major nodes and lesson nodes across all Vulcan quarters. Locking a major automatically locks its five child lessons.</p>
                </div>
                <p class="text-xs uppercase tracking-wide text-slate-500">Checked majors and lessons are locked</p>
            </div>

            <form method="POST" action="{{ route('teacher.sections.phaser-locks.update', $section) }}" class="mt-4 space-y-4">
                @csrf
                @method('PATCH')

                <div class="space-y-4">
                    @foreach ($phaserAccessGroups as $quarter)
                        <section class="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                            <div class="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p class="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">{{ $quarter['label'] }}</p>
                                    <h3 class="mt-1 text-base font-semibold text-slate-900">{{ $quarter['title'] }}</h3>
                                    <p class="mt-1 text-xs text-slate-500">{{ $quarter['subtitle'] }}</p>
                                </div>
                                <span class="badge bg-slate-200 text-slate-700">{{ count($quarter['majors']) }} Major Nodes</span>
                            </div>

                            <div class="mt-4 grid gap-4 xl:grid-cols-3">
                                @foreach ($quarter['majors'] as $major)
                                    @php
                                        $isMajorLocked = in_array($major['major_key'], $selectedLockedMajors, true);
                                    @endphp
                                    <div class="rounded-2xl border {{ $isMajorLocked ? 'border-amber-300 bg-amber-50/70' : 'border-slate-200 bg-white' }} p-4">
                                        <div class="flex items-start justify-between gap-3">
                                            <div>
                                                <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Major {{ $major['major_number'] }}</p>
                                                <p class="mt-1 text-sm font-semibold text-slate-900">{{ $major['title'] }}</p>
                                                <p class="mt-1 text-xs text-slate-500">{{ $quarter['label'] }} {{ $quarter['title'] }}</p>
                                            </div>
                                            <span class="badge {{ $isMajorLocked ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700' }}">
                                                {{ $isMajorLocked ? 'Locked' : 'Unlocked' }}
                                            </span>
                                        </div>

                                        <label class="mt-4 flex items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                name="locked_majors[]"
                                                value="{{ $major['major_key'] }}"
                                                class="h-4 w-4 rounded border-slate-300 text-brand-600"
                                                @checked($isMajorLocked)
                                            >
                                            Lock this entire major node
                                        </label>

                                        <div class="mt-4 space-y-2">
                                            @foreach ($major['lessons'] as $lesson)
                                                @php
                                                    $isLessonLocked = in_array($lesson['lesson_key'], $selectedLockedLessons, true);
                                                    $isEffectivelyLocked = $isMajorLocked || $isLessonLocked;
                                                    $isInheritedLock = $isMajorLocked && ! $isLessonLocked;
                                                @endphp
                                                <label class="flex items-center justify-between gap-3 rounded-2xl border {{ $isEffectivelyLocked ? 'border-amber-200 bg-white/80' : 'border-slate-200 bg-slate-50/80' }} px-3 py-3">
                                                    <div class="min-w-0">
                                                        <p class="text-sm font-semibold text-slate-900">Lesson {{ $lesson['lesson_number'] }}: {{ $lesson['title'] }}</p>
                                                        <p class="mt-1 text-xs text-slate-500">
                                                            @if ($isInheritedLock)
                                                                Locked because {{ $major['title'] }} is locked. Keep this checked too if it should stay locked after the major is unlocked.
                                                            @elseif ($isLessonLocked)
                                                                Explicit lesson lock
                                                            @else
                                                                Individually unlocked
                                                            @endif
                                                        </p>
                                                    </div>

                                                    <div class="flex items-center gap-3">
                                                        <span class="badge {{ $isEffectivelyLocked ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700' }}">
                                                            {{ $isInheritedLock ? 'Locked by Major' : ($isLessonLocked ? 'Locked' : 'Unlocked') }}
                                                        </span>
                                                        <input
                                                            type="checkbox"
                                                            name="locked_lessons[]"
                                                            value="{{ $lesson['lesson_key'] }}"
                                                            class="h-4 w-4 rounded border-slate-300 text-brand-600"
                                                            @checked($isLessonLocked)
                                                        >
                                                    </div>
                                                </label>
                                            @endforeach
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        </section>
                    @endforeach
                </div>

                <div class="flex justify-end">
                    <button class="btn-primary">Save Mini Game Access</button>
                </div>
            </form>
        </section>

        <section class="panel p-5">
            <h2 class="text-lg font-semibold text-slate-900">Students in This Section</h2>
            <div class="mt-4 grid gap-3 md:grid-cols-2">
                @forelse ($section->students as $profile)
                    <a href="{{ route('teacher.students.show', $profile->user_id) }}" class="rounded-xl border border-slate-200 p-3 transition hover:border-brand-300 hover:bg-brand-50">
                        <p class="text-sm font-semibold text-slate-900">{{ $profile->user?->name }}</p>
                        <p class="text-xs text-slate-500">{{ $profile->user?->email }}</p>
                    </a>
                @empty
                    <p class="text-sm text-slate-500">No students assigned yet.</p>
                @endforelse
            </div>
        </section>


    </div>
<x-staff.dialog id="edit-sections" title="Edit section"><form method="POST" action="{{ route('teacher.sections.update', $section) }}" class="mt-4 grid gap-3 sm:grid-cols-2">
                @csrf
                @method('PATCH')
                <div>
                    <label class="mb-1 block text-sm font-medium text-slate-700">Section Name</label>
                    <input type="text" name="name" value="{{ old('name', $section->name) }}" class="input-field" required>
                </div>
                <div>
                    <label class="mb-1 block text-sm font-medium text-slate-700">Join Code</label>
                    <input type="text" name="code" value="{{ old('code', $section->code) }}" class="input-field" required>
                </div>
                <div class="sm:col-span-2">
                    <label class="mb-1 block text-sm font-medium text-slate-700">Description</label>
                    <textarea name="description" rows="3" class="input-field">{{ old('description', $section->description) }}</textarea>
                </div>
                <label class="sm:col-span-2 flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" name="is_active" value="1" class="h-4 w-4 rounded border-slate-300 text-brand-600" @checked($section->is_active)>
                    Section is active
                </label>
                <div class="sm:col-span-2 flex justify-end">
                    <button class="btn-primary">Save Section</button>
                </div>
            </form></x-staff.dialog>
</x-app-layout>



