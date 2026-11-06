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
                        @if (in_array($activity->instructional_phase->value, ['formative', 'summative'], true))
                            @php($bank = $banks->get($activity->topic_id.'-'.$activity->instructional_phase->value))
                            <details class="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <summary class="cursor-pointer text-sm font-semibold text-slate-700">
                                    {{ strtoupper(substr($activity->instructional_phase->value, 0, 2)) }} Question Bank
                                    <span class="font-normal text-slate-500">({{ $bank?->questions_count ?? 0 }}/50–100 questions)</span>
                                </summary>
                                <form method="POST" action="{{ route('teacher.activities.question-bank.update', $activity) }}" class="mt-3 flex flex-wrap items-end gap-2">
                                    @csrf @method('PATCH')
                                    <label class="text-xs font-medium">Questions per attempt<input class="input-field mt-1 w-32" type="number" min="1" max="100" name="questions_per_attempt" value="{{ $bank?->questions_per_attempt ?? 10 }}" required></label>
                                    <button class="btn-secondary px-3 py-2 text-xs">Save count</button>
                                    <span class="text-xs text-slate-500">{{ ($bank?->questions_count ?? 0) >= 50 && ($bank?->questions_count ?? 0) <= 100 ? 'Ready for activation' : 'Add questions until the bank contains 50–100 items.' }}</span>
                                </form>

                                <details class="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                                    <summary class="cursor-pointer text-sm font-semibold">Add a question</summary>
                                    <form method="POST" action="{{ route('teacher.activities.questions.store', $activity) }}" class="mt-3 grid gap-2 md:grid-cols-2">
                                        @csrf
                                        <textarea name="prompt" rows="2" class="input-field md:col-span-2" placeholder="Question prompt" required></textarea>
                                        <select name="question_type" class="input-field"><option value="multiple_choice">Multiple Choice</option><option value="matching">Matching</option><option value="guess_word">Guess Word</option><option value="pics_word">4 Pics 1 Word</option><option value="visual_challenge">Visual Challenge</option></select>
                                        <input name="correct_answer" class="input-field" placeholder="Correct answer (not needed for multiple choice)">
                                        <input type="number" min="1" max="100" name="points" class="input-field" value="1" placeholder="Points">
                                        <input name="media_path" class="input-field" placeholder="Media URL or path (optional)">
                                        <textarea name="payload_json" rows="3" class="input-field md:col-span-2" placeholder='Extra data as JSON, e.g. {"clue":"...","answer":"..."}'></textarea>
                                        <fieldset class="grid gap-2 sm:grid-cols-2 md:col-span-2"><legend class="text-xs font-semibold">Choice answers (multiple choice / visual)</legend>
                                            @foreach (range(0, 3) as $choiceIndex)
                                                <div class="flex gap-2"><input name="choices[{{ $choiceIndex }}][label]" class="input-field" placeholder="Choice {{ $choiceIndex + 1 }}"><input name="choices[{{ $choiceIndex }}][value]" class="input-field w-24" placeholder="Value"><label class="flex items-center gap-1 text-xs"><input type="checkbox" name="choices[{{ $choiceIndex }}][is_correct]" value="1"> Correct</label></div>
                                            @endforeach
                                        </fieldset>
                                        <button class="btn-secondary md:col-span-2">Add to bank</button>
                                    </form>
                                </details>
                                <div class="mt-3 space-y-2">
                                    @foreach (($bank?->questions ?? collect()) as $question)
                                        <details class="rounded-lg border border-slate-200 bg-white p-3">
                                            <summary class="cursor-pointer text-sm">#{{ $question->sort_order }} · {{ $question->prompt }}</summary>
                                            <div class="mt-3 flex justify-end"><form method="POST" action="{{ route('teacher.questions.destroy', $question) }}" onsubmit="return confirm('Delete this bank question?')">@csrf @method('DELETE')<button class="text-xs font-semibold text-rose-700">Delete question</button></form></div>
                                            <form method="POST" action="{{ route('teacher.questions.update', $question) }}" class="mt-2 grid gap-2 md:grid-cols-2">
                                                @csrf @method('PATCH')
                                                <textarea name="prompt" rows="2" class="input-field md:col-span-2" required>{{ $question->prompt }}</textarea>
                                                <select name="question_type" class="input-field">@foreach (['multiple_choice' => 'Multiple Choice', 'matching' => 'Matching', 'guess_word' => 'Guess Word', 'pics_word' => '4 Pics 1 Word', 'visual_challenge' => 'Visual Challenge'] as $type => $label)<option value="{{ $type }}" @selected($question->question_type === $type)>{{ $label }}</option>@endforeach</select>
                                                <input name="correct_answer" class="input-field" value="{{ $question->correct_answer }}" placeholder="Correct answer">
                                                <input type="number" min="1" max="100" name="points" class="input-field" value="{{ $question->points }}" required>
                                                <input type="number" min="0" name="sort_order" class="input-field" value="{{ $question->sort_order }}" required>
                                                <input name="media_path" class="input-field" value="{{ $question->media_path }}" placeholder="Media URL or path">
                                                <textarea name="payload_json" rows="3" class="input-field md:col-span-2" placeholder="Extra data as JSON">{{ json_encode($question->payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</textarea>
                                                <fieldset class="grid gap-2 sm:grid-cols-2 md:col-span-2"><legend class="text-xs font-semibold">Choice answers</legend>
                                                    @foreach (range(0, 3) as $choiceIndex)
                                                        @php($choice = $question->choices->get($choiceIndex))
                                                        <div class="flex gap-2"><input name="choices[{{ $choiceIndex }}][label]" class="input-field" value="{{ $choice?->label }}" placeholder="Choice {{ $choiceIndex + 1 }}"><input name="choices[{{ $choiceIndex }}][value]" class="input-field w-24" value="{{ $choice?->value }}" placeholder="Value"><label class="flex items-center gap-1 text-xs"><input type="checkbox" name="choices[{{ $choiceIndex }}][is_correct]" value="1" @checked($choice?->is_correct)> Correct</label></div>
                                                    @endforeach
                                                </fieldset>
                                                <button class="btn-secondary md:col-span-2">Save question changes</button>
                                            </form>
                                        </details>
                                    @endforeach
                                </div>
                            </details>
                        @endif
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
