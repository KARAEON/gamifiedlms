<x-app-layout title="Lessons and Topics">
    <div class="space-y-6">
        <section class="panel p-6">
            <h1 class="text-2xl font-semibold text-slate-900">Lessons and Topics</h1>
            <p class="mt-1 text-sm text-slate-600">Manage science lesson structure and topic coverage for analytics alignment.</p>
        </section>

        <section class="grid gap-6 lg:grid-cols-2" data-stagger>
            <article class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">Create Lesson</h2>
                <form method="POST" action="{{ route('teacher.lessons.store') }}" class="mt-4 space-y-3">
                    @csrf
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Title</label>
                        <input type="text" name="title" class="input-field" required>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Slug</label>
                        <input type="text" name="slug" class="input-field" required>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Subject</label>
                        <input type="text" name="subject" class="input-field" value="Science" required>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Description</label>
                        <textarea name="description" rows="3" class="input-field"></textarea>
                    </div>
                    <label class="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" name="is_active" value="1" class="h-4 w-4 rounded border-slate-300 text-brand-600" checked>
                        Active lesson
                    </label>
                    <button class="btn-primary">Create Lesson</button>
                </form>
            </article>

            <article class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">Create Topic</h2>
                <form method="POST" action="{{ route('teacher.topics.store') }}" class="mt-4 space-y-3">
                    @csrf
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Lesson</label>
                        <select name="lesson_id" class="input-field" required>
                            <option value="">Select lesson</option>
                            @foreach ($lessons as $lesson)
                                <option value="{{ $lesson->id }}">{{ $lesson->title }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Title</label>
                        <input type="text" name="title" class="input-field" required>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Slug</label>
                        <input type="text" name="slug" class="input-field" required>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Summary</label>
                        <textarea name="summary" rows="2" class="input-field"></textarea>
                    </div>
                    <div class="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label class="mb-1 block text-sm font-medium text-slate-700">Difficulty</label>
                            <input type="number" min="1" max="5" name="difficulty_level" class="input-field" value="2" required>
                        </div>
                        <label class="mt-7 flex items-center gap-2 text-sm text-slate-600">
                            <input type="checkbox" name="is_active" value="1" class="h-4 w-4 rounded border-slate-300 text-brand-600" checked>
                            Active topic
                        </label>
                    </div>
                    <button class="btn-primary">Create Topic</button>
                </form>
            </article>
        </section>

        <section class="panel p-5">
            <h2 class="text-lg font-semibold text-slate-900">Lesson Catalog</h2>
            <div class="mt-4 space-y-4" data-stagger>
                @forelse ($lessons as $lesson)
                    <article class="rounded-2xl border border-slate-200 p-4">
                        <div class="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p class="text-xs uppercase tracking-wider text-brand-600">{{ $lesson->subject }}</p>
                                <h3 class="text-lg font-semibold text-slate-900">{{ $lesson->title }}</h3>
                                <p class="text-sm text-slate-600">{{ $lesson->description }}</p>
                            </div>
                            <span class="badge {{ $lesson->is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700' }}">
                                {{ $lesson->topics_count }} Topics
                            </span>
                        </div>
                        <div class="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            @forelse ($lesson->topics as $topic)
                                <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                                    <p class="text-sm font-semibold text-slate-900">{{ $topic->title }}</p>
                                    <p class="text-xs text-slate-500">{{ $topic->activities_count }} activities | Difficulty {{ $topic->difficulty_level }}</p>
                                </div>
                            @empty
                                <p class="text-sm text-slate-500">No topics created yet.</p>
                            @endforelse
                        </div>
                    </article>
                @empty
                    <div class="empty-state">No lessons created yet.</div>
                @endforelse
            </div>
            <div class="mt-4">
                {{ $lessons->links() }}
            </div>
        </section>
    </div>
</x-app-layout>
