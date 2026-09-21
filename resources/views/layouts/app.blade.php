<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? config('app.name', 'GLMS') }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @livewireStyles
</head>
<body class="app-shell">
    @php
        $role = auth()->user()?->role?->value;
        $isStudent = $role === 'student';
        $isTeacher = $role === 'teacher';
        $isAdmin = $role === 'admin';
    @endphp

    <div
        x-data="{
            sidebarOpen: false,
            showToast: {{ session('status') ? 'true' : 'false' }},
            toastMessage: @js(session('status')),
            toastTimer: null,
            pushToast(message) {
                if (!message) return;
                this.toastMessage = message;
                this.showToast = true;
                if (this.toastTimer) clearTimeout(this.toastTimer);
                this.toastTimer = setTimeout(() => { this.showToast = false; }, 2800);
            },
        }"
        x-init="if (showToast) { toastTimer = setTimeout(() => { showToast = false; }, 2800); }"
        x-on:glms-toast.window="pushToast($event.detail.message ?? '')"
        class="relative min-h-screen overflow-x-hidden w-full max-w-full"
    >
        <div class="apple-glow parallax-layer -left-24 top-0 -z-10 hidden h-72 w-72 bg-white/90 sm:block" data-parallax="0.03"></div>
        <div class="apple-glow parallax-layer -z-10 hidden h-80 w-80 bg-sky-100/70 lg:block lg:right-[-6rem] lg:top-12" data-parallax="0.06"></div>
        <div class="apple-glow parallax-layer bottom-0 left-1/3 -z-10 hidden h-72 w-72 bg-slate-200/55 sm:block" data-parallax="0.04"></div>
        <div class="hero-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[24rem] opacity-50"></div>

        <div x-cloak x-show="showToast" x-transition.opacity.duration.250ms
            class="glass-surface fixed right-4 top-4 z-[70] max-w-sm rounded-[24px] px-4 py-3 text-sm font-semibold text-slate-900">
            <div class="flex items-start gap-3">
                <p class="leading-relaxed" x-text="toastMessage"></p>
                <button @click="showToast = false" class="text-slate-400 hover:text-slate-900">×</button>
            </div>
        </div>

        <div x-cloak x-show="sidebarOpen" x-transition.opacity class="fixed inset-0 z-40 bg-slate-900/55 lg:hidden" @click="sidebarOpen = false"></div>

        <div class="min-h-screen overflow-x-hidden">
            <aside
                :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
                class="app-sidebar fixed inset-y-0 left-0 z-50 w-[18.5rem] max-w-full p-5 transition duration-300 lg:translate-x-0">
                <div class="mb-6 flex items-center justify-between">
                    <a href="{{ route('dashboard') }}" class="flex items-center gap-3">
                        <span class="inline-flex h-11 w-11 items-center justify-center rounded-[22px] border border-white/70 bg-white/85 text-lg font-black text-slate-900 shadow-[0_18px_34px_-24px_rgba(15,23,42,0.45)]">GL</span>
                        <div>
                            <p class="text-sm font-semibold text-slate-900">Gamified LMS</p>
                            <p class="text-xs text-slate-500">Premium learning workspace</p>
                        </div>
                    </a>
                    <button @click="sidebarOpen = false" class="btn-ghost lg:hidden">×</button>
                </div>

                <div class="sidebar-panel mb-5 p-4 motion-fade is-visible">
                    <p class="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{{ strtoupper($role ?? 'user') }} Portal</p>
                    <p class="mt-1 text-sm font-semibold text-slate-800">{{ auth()->user()->name }}</p>
                    <p class="mt-2 text-xs text-slate-500">Focused, elegant, and distraction-light navigation.</p>
                </div>

                <nav class="space-y-1.5" data-stagger>
                    @if ($isStudent)
                        <x-nav-link :href="route('student.dashboard')" :active="request()->routeIs('student.dashboard')" icon="D">Dashboard</x-nav-link>
                        <x-nav-link :href="route('student.lessons.index')" :active="request()->routeIs('student.lessons.*')" icon="L">Lessons</x-nav-link>
                        <x-nav-link :href="route('student.scores.index')" :active="request()->routeIs('student.scores.*')" icon="S">Scores</x-nav-link>
                        <x-nav-link :href="route('student.grading.index')" :active="request()->routeIs('student.grading.*')" icon="RP">Grading</x-nav-link>
                        <x-nav-link :href="route('student.progress.index')" :active="request()->routeIs('student.progress.*')" icon="P">Progress</x-nav-link>
                        <x-nav-link :href="route('student.profile.edit')" :active="request()->routeIs('student.profile.*')" icon="U">Profile</x-nav-link>
                    @elseif ($isTeacher)
                        <x-nav-link :href="route('teacher.dashboard')" :active="request()->routeIs('teacher.dashboard')" icon="D">Dashboard</x-nav-link>
                        <x-nav-link :href="route('teacher.students.index')" :active="request()->routeIs('teacher.students.*')" icon="ST">Students</x-nav-link>
                        <x-nav-link :href="route('teacher.scores.index')" :active="request()->routeIs('teacher.scores.*')" icon="GS">Game Scores</x-nav-link>
                        <x-nav-link :href="route('teacher.grading.index')" :active="request()->routeIs('teacher.grading.*')" icon="RP">Grading</x-nav-link>
                        <x-nav-link :href="route('teacher.sections.index')" :active="request()->routeIs('teacher.sections.*')" icon="SC">Sections</x-nav-link>
                        <x-nav-link :href="route('teacher.lessons.index')" :active="request()->routeIs('teacher.lessons.*') || request()->routeIs('teacher.topics.*')" icon="LS">Lessons and Topics</x-nav-link>
                        <x-nav-link :href="route('teacher.activities.index')" :active="request()->routeIs('teacher.activities.*')" icon="AC">Activities</x-nav-link>
                        <x-nav-link :href="route('teacher.workflow.index')" :active="request()->routeIs('teacher.workflow.*')" icon="WF">Instructional Flow</x-nav-link>
                        <x-nav-link :href="route('teacher.analytics.index')" :active="request()->routeIs('teacher.analytics.*')" icon="AN">Analytics</x-nav-link>
                        <x-nav-link :href="route('teacher.insights.index')" :active="request()->routeIs('teacher.insights.*')" icon="IN">Decision Support</x-nav-link>
                        <x-nav-link :href="route('teacher.reports.index')" :active="request()->routeIs('teacher.reports.*')" icon="RP">Reports</x-nav-link>
                        <x-nav-link :href="route('teacher.profile.edit')" :active="request()->routeIs('teacher.profile.*')" icon="PF">Profile</x-nav-link>
                    @elseif ($isAdmin)
                        <x-nav-link :href="route('admin.dashboard')" :active="request()->routeIs('admin.dashboard')" icon="OV">Overview</x-nav-link>
                        <x-nav-link :href="route('admin.policies.index')" :active="request()->routeIs('admin.policies.*')" icon="PL">Policies</x-nav-link>
                        <x-nav-link :href="route('admin.reports.index')" :active="request()->routeIs('admin.reports.*')" icon="RP">Reports</x-nav-link>
                        <x-nav-link :href="route('admin.audit.index')" :active="request()->routeIs('admin.audit.*')" icon="AU">Audit Trail</x-nav-link>
                    @endif
                </nav>

                <div class="sidebar-panel mt-6 p-4 motion-fade is-visible">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{{ $isStudent ? 'Motivation' : ($isAdmin ? 'Admin Tip' : 'Teaching Tip') }}</p>
                    <p class="mt-1 text-sm font-semibold text-slate-700">
                        {{ $isStudent ? 'Complete one activity today to level up your progress chart.' : ($isAdmin ? 'Track MPS and weak competencies weekly to prioritize interventions.' : 'Use weak-topic trends to plan focused remediation sessions.') }}
                    </p>
                </div>
            </aside>

            <div class="flex min-w-0 w-full max-w-full flex-col lg:pl-[18.5rem]">
                <header class="app-header sticky top-0 z-30 w-full max-w-full px-4 py-3 lg:px-8">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <button @click="sidebarOpen = true" class="btn-secondary px-3 py-2 text-xs lg:hidden">Menu</button>
                            <div>
                                <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{{ $isStudent ? 'Student Workspace' : ($isAdmin ? 'School Head Workspace' : 'Teacher Workspace') }}</p>
                                <h1 class="text-lg font-semibold text-slate-900">{{ $title ?? 'Dashboard' }}</h1>
                            </div>
                        </div>

                        <div class="flex items-center gap-3">
                            <div class="glass-surface hidden rounded-[20px] px-3 py-2 text-right sm:block">
                                <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Today</p>
                                <p class="text-sm font-semibold text-slate-700">{{ now()->format('D, M j') }}</p>
                            </div>
                            <span class="badge {{ $isStudent ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ($isAdmin ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-brand-200 bg-brand-50 text-brand-700') }}">
                                {{ strtoupper($role) }}
                            </span>
                            <form action="{{ route('logout') }}" method="POST">
                                @csrf
                                <button type="submit" class="btn-secondary text-xs">Sign out</button>
                            </form>
                        </div>
                    </div>
                </header>

                <main class="min-w-0 w-full max-w-full flex-1 px-4 py-6 lg:px-8 lg:py-8">
                    {{ $slot }}
                </main>
            </div>
        </div>
    </div>
    @stack('scripts')
    @livewireScripts
</body>
</html>
