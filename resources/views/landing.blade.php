<x-guest-layout title="Learning Insights Platform" variant="apple" :show-school-brand="false">
    <div class="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-12 lg:py-10">
        <header class="flex items-center justify-between motion-reveal is-visible">
            <div class="flex items-center gap-3">
                <span class="school-logo-frame h-11 w-11">
                    <img src="{{ asset('images/branding/catbalogan-city-division-logo.png') }}" alt="Department of Education Division of Catbalogan City logo">
                </span>
                <div>
                    <p class="text-sm font-semibold text-slate-900">Catbalogan I SPED Center</p>
                    <p class="text-xs text-slate-500">Gamified Learning Management System</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <a href="{{ route('student.access.create') }}" class="btn-secondary">Student Access</a>
                <a href="{{ route('login') }}" class="btn-primary">Teacher Sign In</a>
            </div>
        </header>

        <div class="grid flex-1 items-center gap-12 pb-8 pt-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
            <section class="max-w-2xl space-y-6" data-stagger>
                <span class="apple-kicker">Apple-inspired educational dashboard</span>
                <h1 class="apple-hero-title">
                    Refined learning analytics with a calmer premium feel.
                </h1>
                <p class="apple-hero-copy">
                    Track student performance with clarity, hierarchy, and elegant visual depth across lessons, mastery, and intervention planning.
                </p>
                <ul class="space-y-3 text-base text-slate-600">
                    <li class="flex items-center gap-3">
                        <span class="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                        <span>Student and teacher workspaces in one platform.</span>
                    </li>
                    <li class="flex items-center gap-3">
                        <span class="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                        <span>Decision-ready analytics, reports, and intervention cues.</span>
                    </li>
                </ul>
                <div class="flex flex-wrap gap-3 pt-1">
                    <a href="{{ route('student.join.create') }}" class="btn-primary">Join Class</a>
                    <a href="{{ route('register') }}" class="btn-secondary">Teacher Register</a>
                </div>
            </section>

            <section class="apple-card p-6 sm:p-8" data-reveal>
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <h2 class="text-3xl font-semibold tracking-[-0.025em] text-slate-900">Core Modules</h2>
                        <p class="mt-2 text-sm text-slate-500">A complete operational workflow for classroom learning intelligence.</p>
                    </div>
                    <span class="apple-kicker hidden sm:inline-flex">vNext UI</span>
                </div>

                <div class="mt-6 grid gap-3 sm:grid-cols-3">
                    <div class="apple-card-soft p-4">
                        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspaces</p>
                        <p class="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">3</p>
                    </div>
                    <div class="apple-card-soft p-4">
                        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Analytics view</p>
                        <p class="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">Live</p>
                    </div>
                    <div class="apple-card-soft p-4">
                        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Reports</p>
                        <p class="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">PDF / CSV</p>
                    </div>
                </div>

                <div class="mt-6 grid gap-3 sm:grid-cols-2">
                    <article class="panel-soft p-4">
                        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Student</p>
                        <p class="mt-1.5 text-sm leading-relaxed text-slate-700">Lesson flow, activity attempts, score history, and mastery progress.</p>
                    </article>
                    <article class="panel-soft p-4">
                        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Teacher</p>
                        <p class="mt-1.5 text-sm leading-relaxed text-slate-700">Section oversight, performance monitoring, and intervention cues.</p>
                    </article>
                    <article class="panel-soft p-4">
                        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Analytics</p>
                        <p class="mt-1.5 text-sm leading-relaxed text-slate-700">Trends, topic mastery patterns, and section comparison insights.</p>
                    </article>
                    <article class="panel-soft p-4">
                        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Reports</p>
                        <p class="mt-1.5 text-sm leading-relaxed text-slate-700">Printable summaries with PDF/CSV output for planning and review.</p>
                    </article>
                </div>
            </section>
        </div>

        <footer class="pt-6 text-xs text-slate-500">
            Built with Laravel 12, Livewire 3, Tailwind CSS, Alpine.js, and MySQL.
        </footer>
    </div>
</x-guest-layout>
