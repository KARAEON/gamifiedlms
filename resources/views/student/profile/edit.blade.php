<x-app-layout title="Student Profile">
    <div class="mx-auto max-w-3xl space-y-6">
        <section class="panel p-6">
            <p class="section-kicker">Student Profile</p>
            <h1 class="section-title">Profile Settings</h1>
            <p class="section-copy">Keep your details up to date.</p>
        </section>

        <section class="panel p-6">
            <form action="{{ route('student.profile.update') }}" method="POST" class="space-y-4">
                @csrf
                @method('PATCH')

                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Last Name</label>
                        <input type="text" name="last_name" value="{{ old('last_name', $user->studentProfile?->last_name) }}" class="input-field" required>
                        @error('last_name')
                            <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">First Name</label>
                        <input type="text" name="first_name" value="{{ old('first_name', $user->studentProfile?->first_name) }}" class="input-field" required>
                        @error('first_name')
                            <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Middle Name</label>
                        <input type="text" name="middle_name" value="{{ old('middle_name', $user->studentProfile?->middle_name) }}" class="input-field">
                        @error('middle_name')
                            <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</label>
                        <input type="email" name="email" value="{{ old('email', $user->email) }}" class="input-field" required>
                        @error('email')
                            <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Section</label>
                        <input type="text" value="{{ $user->studentProfile?->section?->name ?? 'Unassigned' }}" class="input-field bg-slate-50" readonly>
                    </div>

                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Learner Reference</label>
                        <input type="text" value="{{ $user->studentProfile?->learner_reference ?? 'Pending' }}" class="input-field bg-slate-50" readonly>
                    </div>

                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Guardian Name</label>
                        <input type="text" name="guardian_name" value="{{ old('guardian_name', $user->studentProfile?->guardian_name) }}" class="input-field">
                        @error('guardian_name')
                            <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                        @enderror
                    </div>
                </div>

                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Learning Goal</label>
                    <textarea name="learning_goal" rows="3" class="input-field">{{ old('learning_goal', $user->studentProfile?->learning_goal) }}</textarea>
                    @error('learning_goal')
                        <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                    @enderror
                </div>

                <div class="flex justify-end">
                    <button type="submit" class="btn-primary">Save Profile</button>
                </div>
            </form>
        </section>
    </div>
</x-app-layout>
