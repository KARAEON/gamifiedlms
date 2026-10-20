<x-guest-layout title="Join Class | Lumi Adventures" variant="game" :show-school-brand="false">
    <main class="adventure-auth mx-auto min-h-screen w-full max-w-7xl px-5 pb-10 pt-5 sm:px-8 lg:px-12">
        <x-game-auth-header />
        <div class="flex min-h-[calc(100vh-112px)] items-center py-8">
        <div class="grid w-full items-start gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <section class="hidden lg:block" data-stagger>
                <span class="apple-kicker">Join with a teacher code</span>
                <h1 class="mt-4 max-w-xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] text-slate-900">
                    Your next adventure starts here.
                </h1>
                <p class="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
                    Enter the code from your teacher to unlock your class and set up your explorer profile.
                </p>
                <div class="mt-9 space-y-3">
                    <div class="apple-card-soft p-4">
                        <p class="text-sm font-semibold text-slate-800">Your classroom world</p>
                        <p class="mt-1 text-sm text-slate-600">Your teacher's code takes you to the right class adventure.</p>
                    </div>
                    <div class="apple-card-soft p-4">
                        <p class="text-sm font-semibold text-slate-800">A simple way back</p>
                        <p class="mt-1 text-sm text-slate-600">Use your class code and name whenever you return to play.</p>
                    </div>
                </div>
            </section>

            <section class="apple-card mx-auto w-full max-w-xl p-7 text-slate-900" data-reveal>
                <div class="mb-6 text-center">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Adventure Pass</p>
                    <h2 class="mt-2 text-3xl font-semibold tracking-[-0.02em] text-slate-900">Join your class</h2>
                    <p class="mt-2 text-sm text-slate-500">
                        Already have an account?
                        <a href="{{ route('student.access.create') }}" class="font-semibold text-slate-800 hover:text-black">Student Sign In</a>
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

                <form method="POST" action="{{ route('student.join.verify') }}" class="space-y-3">
                    @csrf
                    <div>
                        <label for="section_code" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Join Code</label>
                        <input id="section_code" name="section_code" type="text" value="{{ old('section_code', $verifiedSection?->code) }}" class="input-field" placeholder="Enter the code from your teacher" required @if (! $verifiedSection) autofocus @endif>
                        @error('section_code')
                            <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                        @enderror
                    </div>
                    <button type="submit" class="btn-secondary w-full">{{ $verifiedSection ? 'Use Different Code' : 'Verify Code' }}</button>
                </form>

                @if ($verifiedSection)
                    <div class="panel-soft mt-4 p-4">
                        <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Verified Section</p>
                        <p class="mt-1 text-lg font-semibold text-slate-900">{{ $verifiedSection->name }}</p>
                        <p class="mt-1 text-sm text-slate-600">Students in this section use <span class="font-semibold">{{ $verifiedSection->code }}</span> when signing in.</p>
                    </div>

                    <form method="POST" action="{{ route('student.join.store') }}" class="mt-5 space-y-4">
                        @csrf

                        <div class="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label for="last_name" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Last Name</label>
                                <input id="last_name" name="last_name" type="text" value="{{ old('last_name') }}" class="input-field" required autofocus>
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

                            <div class="sm:col-span-2">
                                <label for="email" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</label>
                                <input id="email" name="email" type="email" value="{{ old('email') }}" class="input-field" placeholder="you@example.com" required>
                                @error('email')
                                    <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                                @enderror
                            </div>
                        </div>

                        <button type="submit" class="btn-primary w-full">
                            Create Student Account
                        </button>
                    </form>
                @endif

                <div class="panel-soft mt-6 p-4 text-xs text-slate-600">
                    <p class="font-semibold uppercase tracking-[0.12em] text-slate-500">Recovery Tip</p>
                    <p class="mt-2">If this page was left open too long, refresh it and verify the join code again before submitting.</p>
                </div>
            </section>
        </div>
        </div>
    </main>
</x-guest-layout>
