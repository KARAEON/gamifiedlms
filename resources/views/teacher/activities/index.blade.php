<x-app-layout title="Activity Management">
    <div class="space-y-6">
        <x-staff.page-heading title="Activities" description="Build purposeful practice aligned with your lessons and competencies." eyebrow="Teaching and learning">
<button type="button" class="btn-primary" data-open-dialog="create-activity">Create Activity</button>
</x-staff.page-heading>

        <section class="filter-panel">
            <div class="mb-4">
                <p class="section-kicker">Filter Activities</p>
                <h2 class="section-title">Activity Catalog Scope</h2>
            </div>
            <form class="grid gap-3 md:grid-cols-4">
                <select name="activity_type" class="input-field">
                    <option value="">All activity types</option>
                    @foreach ($types as $value => $label)
                        <option value="{{ $value }}" @selected(request('activity_type') === $value)>{{ $label }}</option>
                    @endforeach
                </select>
                <select name="instructional_phase" class="input-field">
                    <option value="">All workflow phases</option>
                    @foreach ($phases as $value => $label)
                        <option value="{{ $value }}" @selected(request('instructional_phase') === $value)>{{ $label }}</option>
                    @endforeach
                </select>
                <select name="topic_id" class="input-field">
                    <option value="">All topics</option>
                    @foreach ($topics as $topic)
                        <option value="{{ $topic->id }}" @selected(request('topic_id') == $topic->id)>{{ $topic->title }} ({{ $topic->lesson?->title }})</option>
                    @endforeach
                </select>
                <button class="btn-primary">Apply Filters</button>
            </form>
        </section>



        <section class="panel p-5">
            <h2 class="text-lg font-semibold text-slate-900">Activities</h2>
            <div class="mt-4 space-y-3">
                @forelse ($activities as $activity)
                    <article class="rounded-2xl border border-slate-200 p-4">
                        <div class="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p class="text-xs uppercase tracking-wider text-brand-600">{{ $types[$activity->activity_type->value] ?? $activity->activity_type->value }}</p>
                                <h3 class="text-lg font-semibold text-slate-900">{{ $activity->title }}</h3>
                                <p class="text-sm text-slate-600">{{ $activity->topic?->lesson?->title }} | {{ $activity->topic?->title }}</p>
                                <p class="mt-1 text-xs text-slate-500">Workflow phase: {{ $phases[$activity->instructional_phase->value] ?? $activity->instructional_phase->value }}</p>
                            </div>
                            <div class="text-right text-xs text-slate-500">
                                <p>{{ $activity->questions_count }} questions</p>
                                <p>Max score: {{ $activity->max_score }}</p>
                                <span class="badge mt-2 {{ $activity->is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700' }}">
                                    {{ $activity->is_active ? 'Active' : 'Disabled' }}
                                </span>
                            </div>
                        </div>
                        <p class="mt-2 text-sm text-slate-600">{{ $activity->instructions }}</p>
                        <button type="button" class="btn-secondary mt-3" data-open-dialog="edit-activity-{{ $activity->id }}">Edit activity</button>
                        <x-staff.dialog id="edit-activity-{{ $activity->id }}" title="Edit activity">
                            <form method="POST" action="{{ route('teacher.activities.update', $activity) }}" class="space-y-4">
                                @csrf @method('PATCH')
                                <fieldset class="space-y-3"><legend class="font-semibold mb-2">Learning alignment</legend>
                                    <x-staff.field name="title" label="Activity title" :value="$activity->title" required />
                                    <label class="block">Topic<select name="topic_id" class="input-field mt-1" required>@foreach ($topics as $topic)<option value="{{ $topic->id }}" @selected($activity->topic_id === $topic->id)>{{ $topic->title }} ({{ $topic->lesson?->title }})</option>@endforeach</select></label>
                                    <div class="grid gap-3 sm:grid-cols-2"><label>Activity type<select name="activity_type" class="input-field mt-1">@foreach ($types as $value => $label)<option value="{{ $value }}" @selected($activity->activity_type->value === $value)>{{ $label }}</option>@endforeach</select></label>
                                    <label>Instructional phase<select name="instructional_phase" class="input-field mt-1">@foreach ($phases as $value => $label)<option value="{{ $value }}" @selected($activity->instructional_phase->value === $value)>{{ $label }}</option>@endforeach</select></label></div>
                                    <label class="block">Instructions<textarea name="instructions" class="input-field mt-1" rows="3">{{ $activity->instructions }}</textarea></label>
                                </fieldset>
                                <fieldset class="space-y-3"><legend class="font-semibold mb-2">Scoring and availability</legend><div class="grid gap-3 sm:grid-cols-2">
                                    <x-staff.field name="max_score" label="Maximum score" type="number" min="1" :value="$activity->max_score" required />
                                    <x-staff.field name="time_limit_seconds" label="Time limit (seconds)" type="number" min="30" max="7200" :value="$activity->time_limit_seconds" />
                                    <x-staff.field name="sort_order" label="Sort order" type="number" min="0" :value="$activity->sort_order" />
                                </div><label class="flex gap-2 items-center"><input type="checkbox" name="allow_retry" value="1" @checked($activity->allow_retry)> Allow retry</label><label class="flex gap-2 items-center"><input type="checkbox" name="is_active" value="1" @checked($activity->is_active)> Active activity</label></fieldset>
                                <button class="btn-primary">Save activity</button>
                            </form>
                        </x-staff.dialog>
                        <details class="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <summary class="cursor-pointer text-sm font-semibold text-slate-700">Add Question</summary>
                            <form method="POST" action="{{ route('teacher.activities.questions.store', $activity) }}" class="mt-3 grid gap-2 sm:grid-cols-2">
                                @csrf
                                <textarea name="prompt" rows="2" class="input-field sm:col-span-2" placeholder="Question prompt" required></textarea>
                                <select name="question_type" class="input-field">
                                    <option value="multiple_choice">Multiple Choice</option>
                                    <option value="matching">Matching</option>
                                    <option value="guess_word">Guess Word</option>
                                    <option value="pics_word">4 Pics 1 Word</option>
                                    <option value="visual_challenge">Visual Challenge</option>
                                </select>
                                <input type="text" name="correct_answer" class="input-field" placeholder="Correct answer">
                                <input type="number" min="1" max="100" name="points" class="input-field" value="20" placeholder="Points">
                                <div class="sm:col-span-2 flex justify-end">
                                    <button class="btn-secondary px-3 py-2 text-xs">Save Question</button>
                                </div>
                            </form>
                        </details>
                    </article>
                @empty
                    <x-staff.empty-state title="No activities in this view" description="Reset your filters or create an activity aligned with a topic." />
                @endforelse
            </div>
            <div class="mt-4">
                {{ $activities->links() }}
            </div>
        </section>
    </div>

<details class="panel p-5"><summary class="font-semibold">Authoring guidance</summary>
                <h2 class="text-lg font-semibold text-slate-900">Activity Design Guidelines</h2>
                <div class="mt-4 space-y-3 text-sm text-slate-700">
                    <p class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        Keep instructions short and actionable for Grade 6 learners.
                    </p>
                    <p class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        Mix question difficulty levels to capture both mastery and misconceptions.
                    </p>
                    <p class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        Ensure each activity is mapped to the correct topic to keep analytics accurate.
                    </p>
                    <p class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        For advanced item authoring, add questions with choices and payload metadata per activity type.
                    </p>
                </div>
            </details>
<x-staff.dialog id="create-activity" title="Create Activity">


                <form method="POST" action="{{ route('teacher.activities.store') }}" class="mt-4 grid gap-3">
                    @csrf
                    <select name="topic_id" class="input-field" required>
                        <option value="">Select topic</option>
                        @foreach ($topics as $topic)
                            <option value="{{ $topic->id }}">{{ $topic->title }} ({{ $topic->lesson?->title }})</option>
                        @endforeach
                    </select>
                    <input type="text" name="title" class="input-field" placeholder="Activity title" required>
                    <select name="activity_type" class="input-field" required>
                        @foreach ($types as $value => $label)
                            <option value="{{ $value }}">{{ $label }}</option>
                        @endforeach
                    </select>
                    <select name="instructional_phase" class="input-field" required>
                        @foreach ($phases as $value => $label)
                            <option value="{{ $value }}">{{ $label }}</option>
                        @endforeach
                    </select>
                    <textarea name="instructions" rows="2" class="input-field" placeholder="Instructions"></textarea>
                    <div class="grid gap-3 sm:grid-cols-2">
                        <input type="number" name="max_score" value="100" class="input-field" placeholder="Max score">
                        <input type="number" name="time_limit_seconds" value="240" class="input-field" placeholder="Time limit (seconds)">
                    </div>
                    <div class="grid gap-3 sm:grid-cols-2">
                        <input type="number" name="sort_order" value="1" class="input-field" placeholder="Sort order">
                        <label class="flex items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-600">
                            <input type="checkbox" name="allow_retry" value="1" checked class="h-4 w-4 rounded border-slate-300 text-brand-600">
                            Allow retry
                        </label>
                    </div>
                    <label class="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" name="is_active" value="1" checked class="h-4 w-4 rounded border-slate-300 text-brand-600">
                        Activity is active
                    </label>
                    <button class="btn-primary">Create Activity</button>
                </form>

</x-staff.dialog>
</x-app-layout>
