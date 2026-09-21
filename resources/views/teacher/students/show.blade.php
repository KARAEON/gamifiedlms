<x-teacher-layout :title="$student->name">
    <div class="space-y-6">
        <section class="panel p-6">
            <a href="{{ route('teacher.students.index') }}" class="text-sm font-medium text-brand-600 hover:text-brand-700">&larr; Back to students</a>
            <div class="mt-3 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 class="text-2xl font-semibold text-slate-900">{{ $student->name }}</h1>
                    <p class="mt-1 text-sm text-slate-600">{{ $student->email }}</p>
                    <p class="mt-1 text-sm text-slate-600">Section: <span class="font-semibold">{{ $student->studentProfile?->section?->name ?? 'Unassigned' }}</span></p>
                    <p class="mt-1 text-sm text-slate-600">Learner Reference: <span class="font-semibold">{{ $student->studentProfile?->learner_reference ?? 'Pending' }}</span></p>
                </div>
                <span class="badge {{ $student->is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700' }}">
                    {{ $student->is_active ? 'Active' : 'Archived' }}
                </span>
            </div>
        </section>

        <section class="panel p-6">
            <h2 class="text-lg font-semibold text-slate-900">Edit Student</h2>
            <form method="POST" action="{{ route('teacher.students.update', $student) }}" class="mt-4 grid gap-3 sm:grid-cols-2">
                @csrf
                @method('PATCH')
                <div>
                    <label class="mb-1 block text-sm font-medium text-slate-700">Last Name</label>
                    <input type="text" name="last_name" value="{{ old('last_name', $student->studentProfile?->last_name) }}" class="input-field" required>
                </div>
                <div>
                    <label class="mb-1 block text-sm font-medium text-slate-700">First Name</label>
                    <input type="text" name="first_name" value="{{ old('first_name', $student->studentProfile?->first_name) }}" class="input-field" required>
                </div>
                <div class="sm:col-span-2">
                    <label class="mb-1 block text-sm font-medium text-slate-700">Middle Name</label>
                    <input type="text" name="middle_name" value="{{ old('middle_name', $student->studentProfile?->middle_name) }}" class="input-field">
                </div>
                <div>
                    <label class="mb-1 block text-sm font-medium text-slate-700">Email</label>
                    <input type="email" name="email" value="{{ old('email', $student->email) }}" class="input-field" required>
                </div>
                <div>
                    <label class="mb-1 block text-sm font-medium text-slate-700">Learner Reference</label>
                    <input type="text" name="learner_reference" value="{{ old('learner_reference', $student->studentProfile?->learner_reference) }}" class="input-field">
                </div>
                <div>
                    <label class="mb-1 block text-sm font-medium text-slate-700">Section</label>
                    <select name="section_id" class="input-field" required>
                        @foreach ($sections as $section)
                            <option value="{{ $section->id }}" @selected(old('section_id', $student->studentProfile?->section_id) == $section->id)>{{ $section->name }}</option>
                        @endforeach
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-sm font-medium text-slate-700">Guardian Name</label>
                    <input type="text" name="guardian_name" value="{{ old('guardian_name', $student->studentProfile?->guardian_name) }}" class="input-field">
                </div>
                <div>
                    <label class="mb-1 block text-sm font-medium text-slate-700">Learning Goal</label>
                    <input type="text" name="learning_goal" value="{{ old('learning_goal', $student->studentProfile?->learning_goal) }}" class="input-field">
                </div>
                <label class="sm:col-span-2 flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" name="is_active" value="1" class="h-4 w-4 rounded border-slate-300 text-brand-600" @checked($student->is_active)>
                    Active account
                </label>
                <div class="sm:col-span-2 flex justify-end">
                    <button class="btn-primary">Save Changes</button>
                </div>
            </form>
        </section>

        <section class="panel p-5">
            <h2 class="text-lg font-semibold text-slate-900">Recent Performance</h2>
            <div class="table-wrap mt-4">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th scope="col">Lesson</th>
                            <th scope="col">Topic</th>
                            <th scope="col">Accuracy</th>
                            <th scope="col">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($scoreRecords as $record)
                            <tr>
                                <td class="py-3">{{ $record->topic?->lesson?->title }}</td>
                                <td class="py-3">{{ $record->topic?->title }}</td>
                                <td class="py-3">{{ number_format($record->accuracy, 1) }}%</td>
                                <td class="py-3">{{ optional($record->attempted_at)->format('M d, Y') }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="4" class="py-6">
                                    <div class="empty-state">No scores recorded yet for this learner.</div>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </section>

        <section class="panel p-5">
            <h2 class="text-lg font-semibold text-slate-900">Attempt History</h2>
            <div class="mt-4 space-y-3">
                @forelse ($attempts as $attempt)
                    <article class="rounded-xl border border-slate-200 p-4">
                        <p class="text-sm font-semibold text-slate-900">{{ $attempt->activity?->title }}</p>
                        <p class="text-xs text-slate-500">{{ $attempt->activity?->topic?->title }} | {{ $attempt->activity?->topic?->lesson?->title }}</p>
                        <div class="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                            <span>Score: <strong>{{ number_format($attempt->score, 1) }}</strong></span>
                            <span>Accuracy: <strong>{{ number_format($attempt->accuracy, 1) }}%</strong></span>
                            <span>Attempt #: <strong>{{ $attempt->attempt_number }}</strong></span>
                            <span>Completed: <strong>{{ optional($attempt->completed_at)->format('M d, Y h:i A') }}</strong></span>
                        </div>
                    </article>
                @empty
                    <p class="text-sm text-slate-500">No attempts found.</p>
                @endforelse
            </div>
            <div class="mt-4">
                {{ $attempts->links() }}
            </div>
        </section>
    </div>
</x-teacher-layout>



