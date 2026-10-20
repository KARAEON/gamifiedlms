<x-guest-layout title="Student Sign In | Lumi Adventures" variant="game" :show-school-brand="false">
    <main class="adventure-auth mx-auto min-h-screen w-full max-w-7xl px-5 pb-10 pt-5 sm:px-8 lg:px-12">
        <x-game-auth-header />
        <div class="flex min-h-[calc(100vh-112px)] items-center py-8">
        <div class="grid w-full items-start gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <section class="hidden lg:block" data-stagger>
                <span class="apple-kicker">Student access</span>
                <h1 class="mt-4 max-w-xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] text-slate-900">
                    Pick up where your adventure left off.
                </h1>
                <p class="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
                    Enter your class code and explorer name to return to your learning world.
                </p>
                <div class="mt-9 space-y-3">
                    <div class="apple-card-soft p-4">
                        <p class="text-sm font-semibold text-slate-800">Your class is your key</p>
                        <p class="mt-1 text-sm text-slate-600">Use the code your teacher shared with your class.</p>
                    </div>
                    <div class="apple-card-soft p-4">
                        <p class="text-sm font-semibold text-slate-800">New explorer?</p>
                        <p class="mt-1 text-sm text-slate-600">Get started with your teacher's code on the Join Class page.</p>
                    </div>
                </div>
            </section>

            <section class="apple-card mx-auto w-full max-w-xl p-7 text-slate-900" data-reveal>
                <div class="mb-6 text-center">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Return to Adventure</p>
                    <h2 class="mt-2 text-3xl font-semibold tracking-[-0.02em] text-slate-900">Access your class</h2>
                    <p class="mt-2 text-sm text-slate-500">
                        New student?
                        <a href="{{ route('student.join.create') }}" class="font-semibold text-slate-800 hover:text-black">Join Class</a>
                    </p>
                    <p class="mt-2 text-sm text-slate-500">
                        Teacher or admin?
                        <a href="{{ route('login') }}" class="font-semibold text-slate-800 hover:text-black">Sign in here</a>
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

                <form method="POST" action="{{ route('student.access.store') }}" class="space-y-4">
                    @csrf

                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="sm:col-span-2">
                            <label for="section_code" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Section Code</label>
                            <input id="section_code" name="section_code" type="text" value="{{ old('section_code') }}" class="input-field" placeholder="Enter the code from your teacher" required autofocus>
                            @error('section_code')
                                <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <div>
                            <label for="last_name" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Last Name</label>
                            <input id="last_name" name="last_name" type="text" value="{{ old('last_name') }}" class="input-field" required>
                            @error('last_name')
                                <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <div>
                            <label for="first_name" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">First Name</label>
                            <input id="first_name" name="first_name" type="text" value="{{ old('first_name') }}" class="input-field" required>
                            @error('first_name')
                                <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <div class="sm:col-span-2">
                            <label for="middle_name" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Middle Name</label>
                            <input id="middle_name" name="middle_name" type="text" value="{{ old('middle_name') }}" class="input-field">
                            @error('middle_name')
                                <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        @php
                            $showLearnerReference = session('student_login_requires_learner_reference') || old('learner_reference');
                        @endphp
                        @if ($showLearnerReference)
                            <div class="sm:col-span-2">
                                <label for="learner_reference" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Learner Reference</label>
                                <input id="learner_reference" name="learner_reference" type="text" value="{{ old('learner_reference') }}" class="input-field" placeholder="Enter your learner reference">
                                @error('learner_reference')
                                    <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                                @enderror
                            </div>
                        @endif
                    </div>

                    <button type="submit" class="btn-primary w-full">
                        Student Sign In
                    </button>
                </form>

                <div class="panel-soft mt-6 p-4 text-xs text-slate-600">
                    <p class="font-semibold uppercase tracking-[0.12em] text-slate-500">Recovery Tip</p>
                    <p class="mt-2">If this page sat open for a while or you switched between `localhost` and `127.0.0.1`, refresh before submitting.</p>
                </div>
            </section>
        </div>
        </div>
    </main>
</x-guest-layout>
