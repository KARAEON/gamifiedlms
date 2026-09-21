<x-app-layout title="Grading Policy Management">
    <div class="space-y-6">
        <section class="panel p-6">
            <h1 class="text-2xl font-semibold text-slate-900">Grading and Mastery Policies</h1>
            <p class="mt-1 text-sm text-slate-600">
                Configure mastery thresholds, class attainment gates, and grade component weights per section/subject.
            </p>
        </section>

        <section class="grid gap-6 xl:grid-cols-2">
            <article class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">Create Policy</h2>
                <form method="POST" action="{{ route('admin.policies.store') }}" class="mt-4 grid gap-3">
                    @csrf
                    <input type="text" name="name" class="input-field" placeholder="Policy name" required>
                    <div class="grid gap-3 md:grid-cols-2">
                        <select name="scope" class="input-field" required>
                            <option value="global">Global</option>
                            <option value="section">Section</option>
                        </select>
                        <select name="section_id" class="input-field">
                            <option value="">No section (global)</option>
                            @foreach ($sections as $section)
                                <option value="{{ $section->id }}">{{ $section->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <input type="text" name="subject" class="input-field" placeholder="Subject filter (optional)">
                    <div class="grid gap-3 md:grid-cols-2">
                        <input type="date" name="effective_from" class="input-field">
                        <input type="date" name="effective_to" class="input-field">
                    </div>
                    <div class="grid gap-3 md:grid-cols-2">
                        <input type="number" min="50" max="100" step="0.01" name="mastery_threshold" value="75" class="input-field" placeholder="Mastery threshold">
                        <input type="number" min="50" max="100" step="0.01" name="attainment_threshold" value="80" class="input-field" placeholder="Attainment threshold">
                    </div>
                    <div class="grid gap-3 md:grid-cols-3">
                        <input type="number" min="0" max="100" name="gamified_weight" value="20" class="input-field" placeholder="Gamified weight">
                        <input type="number" min="0" max="100" name="formative_weight" value="40" class="input-field" placeholder="Formative weight">
                        <input type="number" min="0" max="100" name="summative_weight" value="40" class="input-field" placeholder="Summative weight">
                    </div>
                    <label class="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" name="weekly_summative_required" value="1" checked class="h-4 w-4 rounded border-slate-300 text-brand-600">
                        Weekly summative required
                    </label>
                    <label class="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" name="is_active" value="1" checked class="h-4 w-4 rounded border-slate-300 text-brand-600">
                        Active policy
                    </label>
                    <div class="flex justify-end">
                        <button class="btn-primary">Create Policy</button>
                    </div>
                </form>
            </article>

            <article class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">Policy Rules</h2>
                <div class="mt-4 space-y-3 text-sm text-slate-700">
                    <p class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        Ensure component weights sum to exactly 100%.
                    </p>
                    <p class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        Use section-specific policies to override global defaults for targeted interventions.
                    </p>
                    <p class="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        Mastery and attainment thresholds directly drive the teacher progression decision gate.
                    </p>
                </div>
            </article>
        </section>

        <section class="panel p-5">
            <h2 class="text-lg font-semibold text-slate-900">Policy Registry</h2>
            <div class="mt-4 space-y-3">
                @forelse ($policies as $policy)
                    <details class="rounded-2xl border border-slate-200 p-4">
                        <summary class="cursor-pointer text-sm font-semibold text-slate-900">
                            {{ $policy->name }} • {{ strtoupper($policy->scope) }} • {{ $policy->is_active ? 'ACTIVE' : 'INACTIVE' }}
                        </summary>
                        <p class="mt-2 text-xs text-slate-500">
                            Section: {{ $policy->section?->name ?? '-' }} |
                            Subject: {{ $policy->subject ?? '-' }} |
                            Effective: {{ optional($policy->effective_from)->format('M d, Y') ?? '-' }} to {{ optional($policy->effective_to)->format('M d, Y') ?? '-' }}
                        </p>
                        <form method="POST" action="{{ route('admin.policies.update', $policy) }}" class="mt-3 grid gap-2">
                            @csrf
                            @method('PATCH')
                            <input type="text" name="name" class="input-field" value="{{ $policy->name }}" required>
                            <div class="grid gap-2 sm:grid-cols-2">
                                <select name="scope" class="input-field" required>
                                    <option value="global" @selected($policy->scope === 'global')>Global</option>
                                    <option value="section" @selected($policy->scope === 'section')>Section</option>
                                </select>
                                <select name="section_id" class="input-field">
                                    <option value="">No section</option>
                                    @foreach ($sections as $section)
                                        <option value="{{ $section->id }}" @selected((int) $policy->section_id === (int) $section->id)>{{ $section->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                            <div class="grid gap-2 sm:grid-cols-2">
                                <input type="text" name="subject" class="input-field" value="{{ $policy->subject }}">
                                <input type="number" min="50" max="100" step="0.01" name="mastery_threshold" class="input-field" value="{{ $policy->mastery_threshold }}">
                            </div>
                            <div class="grid gap-2 sm:grid-cols-2">
                                <input type="number" min="50" max="100" step="0.01" name="attainment_threshold" class="input-field" value="{{ $policy->attainment_threshold }}">
                                <input type="date" name="effective_from" class="input-field" value="{{ optional($policy->effective_from)->toDateString() }}">
                            </div>
                            <div class="grid gap-2 sm:grid-cols-2">
                                <input type="date" name="effective_to" class="input-field" value="{{ optional($policy->effective_to)->toDateString() }}">
                                <input type="number" min="0" max="100" name="gamified_weight" class="input-field" value="{{ $policy->gamified_weight }}">
                            </div>
                            <div class="grid gap-2 sm:grid-cols-2">
                                <input type="number" min="0" max="100" name="formative_weight" class="input-field" value="{{ $policy->formative_weight }}">
                                <input type="number" min="0" max="100" name="summative_weight" class="input-field" value="{{ $policy->summative_weight }}">
                            </div>
                            <div class="grid gap-2 sm:grid-cols-2">
                                <label class="flex items-center gap-2 text-sm text-slate-600">
                                    <input type="checkbox" name="weekly_summative_required" value="1" @checked($policy->weekly_summative_required) class="h-4 w-4 rounded border-slate-300 text-brand-600">
                                    Weekly summative required
                                </label>
                                <label class="flex items-center gap-2 text-sm text-slate-600">
                                    <input type="checkbox" name="is_active" value="1" @checked($policy->is_active) class="h-4 w-4 rounded border-slate-300 text-brand-600">
                                    Active
                                </label>
                            </div>
                            <div class="flex justify-end">
                                <button class="btn-secondary px-3 py-2 text-xs">Update Policy</button>
                            </div>
                        </form>
                    </details>
                @empty
                    <div class="empty-state">No grading policies configured yet.</div>
                @endforelse
            </div>
            <div class="mt-4">{{ $policies->links() }}</div>
        </section>
    </div>
</x-app-layout>
