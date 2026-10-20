<x-guest-layout title="Teacher Sign In | Lumi Adventures" variant="game" :show-school-brand="false">
    <main class="adventure-auth mx-auto min-h-screen w-full max-w-7xl px-5 pb-10 pt-5 sm:px-8 lg:px-12">
        <x-game-auth-header />
        <div class="flex min-h-[calc(100vh-112px)] items-center py-8">
        <div class="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <section class="hidden lg:block" data-stagger>
                <span class="apple-kicker">Teacher and admin access</span>
                <h1 class="mt-4 max-w-xl text-5xl font-semibold leading-[1.04] tracking-[-0.04em] text-slate-900">
                    Welcome back.
                </h1>
                <p class="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
                    Sign in with your staff credentials to manage sections, view analytics, and update classroom workflows.
                </p>

                <div class="mt-10 grid max-w-lg gap-3 sm:grid-cols-2">
                    <div class="apple-card-soft p-4 text-sm text-slate-600">
                        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Teachers</p>
                        <p class="mt-2">Manage join codes, student records, and classroom performance.</p>
                    </div>
                    <div class="apple-card-soft p-4 text-sm text-slate-600">
                        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Admins</p>
                        <p class="mt-2">Review reports, policies, and school-wide analytics.</p>
                    </div>
                    <div class="apple-card-soft p-4 text-sm text-slate-600 sm:col-span-2">
                        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Students</p>
                        <p class="mt-2">Students do not use email/password here. They sign in with a teacher-issued section code.</p>
                    </div>
                </div>
            </section>

            <section class="apple-card mx-auto w-full max-w-md p-8 text-slate-900" data-reveal>
                <div class="mb-7 text-center">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Teacher Sign In</p>
                    <h2 class="mt-2 text-3xl font-semibold tracking-[-0.02em] text-slate-900">Lumi Adventures</h2>
                    <p class="mt-2 text-sm text-slate-500">
                        Need a teacher account?
                        <a href="{{ route('register') }}" class="font-semibold text-slate-800 transition hover:text-black">Create one</a>
                    </p>
                    <p class="mt-2 text-sm text-slate-500">
                        Student access starts at
                        <a href="{{ route('student.access.create') }}" class="font-semibold text-slate-800 transition hover:text-black">Student Sign In</a>.
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
                    <div class="mb-4 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2.5 text-sm text-red-700">
                        <p class="font-medium">Unable to sign in. Check your credentials.</p>
                    </div>
                @endif

                <form method="POST" action="{{ route('login.store') }}" class="space-y-4">
                    @csrf

                    <div>
                        <label for="email" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value="{{ old('email') }}"
                            class="apple-input"
                            placeholder="you@example.com"
                            required
                            autofocus
                        >
                        @error('email')
                            <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <div>
                        <label for="password" class="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            class="apple-input"
                            placeholder="Enter your password"
                            required
                        >
                        @error('password')
                            <p class="mt-1 text-xs text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <label class="flex items-center gap-2.5 text-sm text-slate-600">
                        <input type="checkbox" name="remember" class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300">
                        Keep me signed in
                    </label>

                    <button type="submit" class="btn-primary h-11 w-full">Sign In</button>
                </form>

                <div class="panel-soft mt-6 p-4 text-xs text-slate-600">
                    <p class="font-semibold uppercase tracking-[0.12em] text-slate-500">Student Access</p>
                    <p class="mt-2">New student? Use <a href="{{ route('student.join.create') }}" class="font-semibold text-slate-800 hover:text-black">Join Class</a>.</p>
                    <p class="mt-2">Returning student? Use <a href="{{ route('student.access.create') }}" class="font-semibold text-slate-800 hover:text-black">Student Sign In</a>.</p>
                    <p class="mt-2">If this page was open for a while, refresh it before signing in.</p>
                </div>
            </section>
        </div>
        </div>
    </main>
</x-guest-layout>
