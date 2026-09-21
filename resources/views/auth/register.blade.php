<x-guest-layout title="Teacher Registration | Learning Insights Platform" variant="apple">
    <div class="mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-8 lg:px-12">
        <div class="grid w-full items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <section class="hidden lg:block" data-stagger>
                <span class="apple-kicker">Teacher onboarding</span>
                <h1 class="mt-4 max-w-xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] text-slate-900">
                    Create your teacher workspace.
                </h1>
                <p class="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
                    Manage sections, publish lessons, monitor scores, and issue join codes that students use for access.
                </p>
                <div class="mt-9 space-y-3">
                    <div class="apple-card-soft p-4">
                        <p class="text-sm font-semibold text-slate-800">Student access</p>
                        <p class="mt-1 text-sm text-slate-600">Students join sections using the teacher-issued join code.</p>
                    </div>
                    <div class="apple-card-soft p-4">
                        <p class="text-sm font-semibold text-slate-800">Teacher analytics</p>
                        <p class="mt-1 text-sm text-slate-600">Track section performance, grading, and intervention signals in one view.</p>
                    </div>
                </div>
            </section>

            <section class="apple-card mx-auto w-full max-w-xl p-7 text-slate-900" data-reveal>
                <div class="mb-6 text-center">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Teacher Register</p>
                    <h2 class="mt-2 text-3xl font-semibold tracking-[-0.02em] text-slate-900">Create teacher account</h2>
                    <p class="mt-2 text-sm text-slate-500">
                        Already registered?
                        <a href="{{ route('login') }}" class="font-semibold text-slate-800 hover:text-black">Teacher sign in</a>
                    </p>
                    <p class="mt-2 text-sm text-slate-500">
                        Student access starts at
                        <a href="{{ route('student.join.create') }}" class="font-semibold text-slate-800 hover:text-black">Join Class</a>.
                    </p>
                </div>

                @php
                    $statusMessage = session('status') ?: (request()->boolean('expired') ? 'This page expired. Refresh and try again.' : null);
                @endphp

                @if ($statusMessage)
                    <div class="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-800">
                        <p class="font-medium">{{ $statusMessage }}</p>
                    </div>
                @endif

                @if ($errors->any())
                    <div class="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                        <p class="font-semibold">Please review the highlighted fields.</p>
                    </div>
                @endif

                <form method="POST" action="{{ route('register.store') }}" class="space-y-4">
                    @csrf

                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="sm:col-span-2">
                            <label for="name" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Full Name</label>
                            <input id="name" name="name" type="text" value="{{ old('name') }}" class="input-field" placeholder="Enter your full name" required autofocus>
                            @error('name')
                                <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <div class="sm:col-span-2">
                            <label for="email" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</label>
                            <input id="email" name="email" type="email" value="{{ old('email') }}" class="input-field" placeholder="you@example.com" required>
                            @error('email')
                                <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <div>
                            <label for="teacher_title" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Title</label>
                            <input id="teacher_title" name="teacher_title" type="text" value="{{ old('teacher_title') }}" class="input-field" placeholder="Grade 6 Science Teacher">
                            @error('teacher_title')
                                <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <div>
                            <label for="teacher_specialization" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Specialization</label>
                            <input id="teacher_specialization" name="teacher_specialization" type="text" value="{{ old('teacher_specialization') }}" class="input-field" placeholder="Inquiry-Based Science">
                            @error('teacher_specialization')
                                <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <div>
                            <label for="password" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Password</label>
                            <input id="password" name="password" type="password" class="input-field" required>
                            @error('password')
                                <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <div>
                            <label for="password_confirmation" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Confirm Password</label>
                            <input id="password_confirmation" name="password_confirmation" type="password" class="input-field" required>
                        </div>
                    </div>

                    <button type="submit" class="btn-primary w-full">
                        Create Teacher Account
                    </button>
                </form>

                <div class="panel-soft mt-6 p-4 text-xs text-slate-600">
                    <p class="font-semibold uppercase tracking-[0.12em] text-slate-500">Recovery Tip</p>
                    <p class="mt-2">If you opened this form a while ago, refresh before submitting so the security token stays current.</p>
                </div>
            </section>
        </div>
    </div>
</x-guest-layout>
