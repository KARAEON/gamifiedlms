@props(['title' => null])

@php
    $title = $title ?? 'Teacher Portal';
    $groups = [
        'Overview' => [
            ['Dashboard', 'teacher.dashboard', 'teacher.dashboard'],
        ],
        'Learners' => [
            ['Students', 'teacher.students.index', 'teacher.students.*'],
            ['Sections', 'teacher.sections.index', 'teacher.sections.*'],
            ['Game Scores', 'teacher.scores.index', 'teacher.scores.*'],
            ['Grading', 'teacher.grading.index', 'teacher.grading.*'],
        ],
        'Teaching' => [
            ['Lessons & Topics', 'teacher.lessons.index', 'teacher.lessons.*|teacher.topics.*'],
            ['Activities', 'teacher.activities.index', 'teacher.activities.*'],
            ['Instructional Flow', 'teacher.workflow.index', 'teacher.workflow.*'],
        ],
        'Insights' => [
            ['Analytics', 'teacher.analytics.index', 'teacher.analytics.*'],
            ['Decision Support', 'teacher.insights.index', 'teacher.insights.*'],
            ['Reports', 'teacher.reports.index', 'teacher.reports.*'],
        ],
        'Account' => [
            ['Profile', 'teacher.profile.edit', 'teacher.profile.*'],
        ],
    ];
@endphp

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title }} · Catbalogan I SPED Center</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @livewireStyles
</head>
<body class="teacher-shell">
    <a class="teacher-skip-link" href="#teacher-main">Skip to main content</a>
    <div x-data="{ navOpen: false, showToast: {{ session('status') ? 'true' : 'false' }}, toastMessage: @js(session('status')), toastTimer: null, pushToast(message) { if (!message) return; this.toastMessage = message; this.showToast = true; clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => this.showToast = false, 3500); } }"
         x-init="if (showToast) toastTimer = setTimeout(() => showToast = false, 3500)"
         x-on:glms-toast.window="pushToast($event.detail.message ?? '')"
         x-on:keydown.escape.window="navOpen = false"
         class="min-h-screen">
        <div x-cloak x-show="showToast" x-transition.opacity role="status" aria-live="polite" class="teacher-toast">
            <span x-text="toastMessage"></span>
            <button type="button" @click="showToast = false" aria-label="Dismiss notification">×</button>
        </div>

        <div x-cloak x-show="navOpen" x-transition.opacity class="teacher-nav-backdrop" @click="navOpen = false" aria-hidden="true"></div>
        <aside id="teacher-navigation" class="teacher-sidebar" :class="navOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'" aria-label="Teacher portal navigation">
            <div class="teacher-brand">
                <a href="{{ route('teacher.dashboard') }}" class="flex items-center gap-3">
                    <span class="teacher-brand-mark" aria-hidden="true">CI</span>
                    <span>
                        <span class="teacher-brand-name">Catbalogan I SPED Center</span>
                        <span class="teacher-brand-meta">School ID 193540 · Teacher Portal</span>
                    </span>
                </a>
                <button type="button" class="teacher-icon-button lg:hidden" @click="navOpen = false" aria-label="Close navigation">×</button>
            </div>
            <p class="teacher-user-name">{{ auth()->user()->name }}</p>
            <nav class="teacher-nav" aria-label="Primary navigation">
                @foreach ($groups as $group => $items)
                    <section class="teacher-nav-group" aria-labelledby="teacher-nav-{{ str($group)->slug() }}">
                        <h2 id="teacher-nav-{{ str($group)->slug() }}">{{ $group }}</h2>
                        @foreach ($items as [$label, $route, $patterns])
                            @php $active = collect(explode('|', $patterns))->contains(fn ($pattern) => request()->routeIs($pattern)); @endphp
                            <a href="{{ route($route) }}" @click="navOpen = false" class="teacher-nav-link {{ $active ? 'is-active' : '' }}" @if($active) aria-current="page" @endif>
                                <span>{{ $label }}</span>
                            </a>
                        @endforeach
                    </section>
                @endforeach
            </nav>
            <div class="teacher-sidebar-foot">Use class evidence to plan the next best instructional step.</div>
        </aside>

        <div class="teacher-content">
            <header class="teacher-header">
                <div class="flex min-w-0 items-center gap-3">
                    <button type="button" class="teacher-menu-button lg:hidden" @click="navOpen = true" :aria-expanded="navOpen.toString()" aria-controls="teacher-navigation">Menu</button>
                    <div class="min-w-0">
                        <p class="teacher-eyebrow">Teacher workspace</p>
                        <h1>{{ $title }}</h1>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <span class="teacher-date hidden sm:inline">{{ now()->format('l, F j') }}</span>
                    <form action="{{ route('logout') }}" method="POST">
                        @csrf
                        <button type="submit" class="teacher-signout">Sign out</button>
                    </form>
                </div>
            </header>
            <main id="teacher-main" tabindex="-1" class="teacher-main">
                {{ $slot }}
            </main>
        </div>
    </div>
    @stack('scripts')
    @livewireScripts
</body>
</html>
