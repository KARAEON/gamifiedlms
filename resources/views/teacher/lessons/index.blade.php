<x-app-layout title="Lessons and Topics">
    <div class="space-y-6">
        <x-staff.page-heading title="Lessons and topics" description="Organize science lessons, topics, and learning coverage." eyebrow="Teaching and learning">
<button type="button" class="btn-primary" data-open-dialog="create-lesson">Create Lesson</button>
<button type="button" class="btn-secondary" data-open-dialog="create-topic">Create Topic</button>
</x-staff.page-heading>



        <section class="panel p-5">
            <h2 class="text-lg font-semibold text-slate-900">Lesson Catalog</h2>
            <div class="mt-4 space-y-4" data-stagger>
                @forelse ($lessons as $lesson)
                    <details class="rounded-xl border border-slate-200 p-4">
                        <summary class="flex flex-wrap items-start justify-between gap-3 cursor-pointer" aria-label="Expand lesson and topics">
                            <div>
                                <p class="text-xs uppercase tracking-wider text-brand-600">{{ $lesson->subject }}</p>
                                <h3 class="text-lg font-semibold text-slate-900">{{ $lesson->title }}</h3>
                                <p class="text-sm text-slate-600">{{ $lesson->description }}</p>
                            </div>
                            <span class="badge {{ $lesson->is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700' }}">
                                {{ $lesson->topics_count }} Topics
                            </span>
                        </summary>
                        <button type="button" class="btn-secondary mt-3" data-open-dialog="edit-lesson-{{ $lesson->id }}">Edit lesson</button>
                        <x-staff.dialog id="edit-lesson-{{ $lesson->id }}" title="Edit lesson">
                            <form method="POST" action="{{ route('teacher.lessons.update', $lesson) }}" class="space-y-3">
                                @csrf @method('PATCH')
                                <x-staff.field name="title" label="Lesson title" :value="$lesson->title" required />
                                <x-staff.field name="slug" label="Slug" :value="$lesson->slug" required />
                                <x-staff.field name="subject" label="Subject" :value="$lesson->subject" required />
                                <label class="block">Description<textarea name="description" class="input-field mt-1" rows="3">{{ $lesson->description }}</textarea></label>
                                <label class="flex gap-2 items-center"><input type="checkbox" name="is_active" value="1" @checked($lesson->is_active)> Active lesson</label>
                                <button class="btn-primary">Save lesson</button>
                            </form>
                        </x-staff.dialog>
                        <div class="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            @forelse ($lesson->topics as $topic)
                                <div class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                                    <p class="text-sm font-semibold text-slate-900">{{ $topic->title }}</p>
                                    <p class="text-xs text-slate-500">{{ $topic->activities_count }} activities | Difficulty {{ $topic->difficulty_level }}</p>
                                    <button type="button" class="btn-ghost mt-2" data-open-dialog="edit-topic-{{ $topic->id }}">Edit topic</button>
                                    <x-staff.dialog id="edit-topic-{{ $topic->id }}" title="Edit topic">
                                        <form method="POST" action="{{ route('teacher.topics.update', $topic) }}" class="space-y-3">
                                            @csrf @method('PATCH')
                                            <input type="hidden" name="lesson_id" value="{{ $lesson->id }}">
                                            <x-staff.field name="title" label="Topic title" :value="$topic->title" required />
                                            <x-staff.field name="slug" label="Slug" :value="$topic->slug" required />
                                            <label class="block">Summary<textarea name="summary" class="input-field mt-1" rows="3">{{ $topic->summary }}</textarea></label>
                                            <x-staff.field name="difficulty_level" label="Difficulty (1 to 5)" type="number" min="1" max="5" :value="$topic->difficulty_level" required />
                                            <label class="flex gap-2 items-center"><input type="checkbox" name="is_active" value="1" @checked($topic->is_active)> Active topic</label>
                                            <button class="btn-primary">Save topic</button>
                                        </form>
                                    </x-staff.dialog>
                                </div>
                            @empty
                                <p class="text-sm text-slate-500">No topics created yet.</p>
                            @endforelse
                        </div>
                    </details>
                @empty
                    <x-staff.empty-state title="Your lesson catalog starts here" description="Create a lesson, then add topics to organize your learning activities." />
                @endforelse
            </div>
            <div class="mt-4">
                {{ $lessons->links() }}
            </div>
        </section>
    </div>

<x-staff.dialog id="create-lesson" title="Create Lesson">


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

</x-staff.dialog>
<x-staff.dialog id="create-topic" title="Create Topic">


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

</x-staff.dialog>
</x-app-layout>
