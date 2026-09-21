<x-teacher-layout title="Teacher Profile">
    <div class="mx-auto max-w-3xl space-y-6">
        <section class="panel p-6">
            <p class="section-kicker">Teacher Profile</p>
            <h1 class="section-title">Account and Specialization</h1>
            <p class="section-copy">Manage your account and instructional details.</p>
        </section>

        <section class="panel p-6">
            <form method="POST" action="{{ route('teacher.profile.update') }}" class="space-y-4">
                @csrf
                @method('PATCH')

                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Name</label>
                        <input type="text" name="name" value="{{ old('name', $user->name) }}" class="input-field" required>
                    </div>

                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</label>
                        <input type="email" name="email" value="{{ old('email', $user->email) }}" class="input-field" required>
                    </div>

                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Title</label>
                        <input type="text" name="title" value="{{ old('title', $user->teacherProfile?->title) }}" class="input-field">
                    </div>

                    <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Specialization</label>
                        <input type="text" name="specialization" value="{{ old('specialization', $user->teacherProfile?->specialization) }}" class="input-field">
                    </div>
                </div>

                <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Bio</label>
                    <textarea name="bio" rows="4" class="input-field">{{ old('bio', $user->teacherProfile?->bio) }}</textarea>
                </div>

                <div class="flex justify-end">
                    <button class="btn-primary">Save Profile</button>
                </div>
            </form>
        </section>
    </div>
</x-teacher-layout>
