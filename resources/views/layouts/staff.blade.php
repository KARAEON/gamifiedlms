<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title }} &middot; GLMS</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @livewireStyles
</head>
@php
    $teacher = auth()->user()->role->value === 'teacher';
    $groups = $teacher ? [
        'Overview' => [['dashboard', 'Dashboard']],
        'Classes' => [['sections', 'Sections'], ['students', 'Students']],
        'Teaching' => [['lessons', 'Lessons and Topics'], ['activities', 'Activities'], ['workflow', 'Instructional Flow']],
        'Assessment' => [['scores', 'Game Scores'], ['grading', 'Grading']],
        'Insights' => [['analytics', 'Analytics'], ['insights', 'Decision Support'], ['reports', 'Reports']],
    ] : [
        'School management' => [['dashboard', 'Overview'], ['school-term', 'School Term'], ['reports', 'Reports'], ['policies', 'Policies'], ['audit', 'Audit Trail']],
    ];
    $prefix = $teacher ? 'teacher.' : 'admin.';
    $staffIcons = [
        'dashboard' => 'compass', 'sections' => 'sections', 'students' => 'learners',
        'lessons' => 'book', 'activities' => 'crystal', 'workflow' => 'map',
        'scores' => 'trophy', 'grading' => 'scroll', 'analytics' => 'chart',
        'insights' => 'spark', 'reports' => 'quill', 'school-term' => 'scroll',
        'policies' => 'shield', 'audit' => 'chart',
    ];
@endphp
<body class="staff-workspace staff-shell staff-adventure-workspace">
    <a class="staff-skip-link" href="#workspace-main">Skip to content</a>
    <div class="staff-drawer-backdrop" data-close-sidebar hidden></div>

    <aside class="app-sidebar staff-sidebar" id="staff-navigation" aria-label="Workspace navigation">
        <div class="staff-brand">
            <a href="{{ route($prefix.'dashboard') }}">
                <span class="teacher-brand-crest"><x-teacher.icon name="compass" /></span>
                <span class="teacher-brand-wordmark"><strong>LUMI</strong><small>ADVENTURES</small></span>
            </a>
            <button type="button" data-close-sidebar class="btn-ghost staff-mobile-only" aria-label="Close navigation">&times;</button>
        </div>

        <p class="staff-workspace-label">{{ $teacher ? 'Teacher workspace' : 'School Head workspace' }}</p>
        <div class="staff-adventure-workspace-intro"><span aria-hidden="true">✦</span> {{ $teacher ? 'Behind every great adventure is a teacher.' : 'Guiding learning across the school.' }}</div>

        <nav>
            @foreach ($groups as $group => $items)
                <div class="staff-nav-group">
                    <p>{{ $group }}</p>
                    @foreach ($items as [$key, $label])
                        @php
                            $route = $prefix.$key.($key === 'dashboard' ? '' : '.index');
                            $active = request()->routeIs($prefix.$key.'.*')
                                || request()->routeIs($prefix.$key)
                                || ($key === 'lessons' && request()->routeIs('teacher.topics.*'));
                        @endphp
                        <a href="{{ route($route) }}" class="teacher-nav-link" @if ($active) aria-current="page" @endif>
                            <x-teacher.icon :name="$staffIcons[$key]" />
                            <span>{{ $label }}</span>
                            @if ($active)<span class="teacher-nav-marker" aria-hidden="true">◆</span>@endif
                        </a>
                    @endforeach
                </div>
            @endforeach
        </nav>

        <footer class="staff-sidebar-footer">
            <div class="teacher-school-mark">
                <img src="{{ asset('images/branding/catbalogan-city-division-logo.png') }}" alt="">
                <span>Catbalogan I SPED Center<small>{{ $teacher ? 'Learning, one adventure at a time.' : 'School leadership workspace.' }}</small></span>
            </div>
            @if ($teacher)
                <x-nav-link :href="route('teacher.profile.edit')" :active="request()->routeIs('teacher.profile.*')" icon="PF">My profile</x-nav-link>
            @endif
            <div class="staff-user">
                <span class="staff-avatar" aria-hidden="true">{{ mb_substr(auth()->user()->name, 0, 1) }}</span>
                <div><strong>{{ auth()->user()->name }}</strong><small>{{ $teacher ? 'Teacher' : 'School Head' }}</small></div>
            </div>
        </footer>
    </aside>

    <div class="staff-content">
        <header class="app-header staff-header">
            <div class="staff-header-context">
                <button type="button" class="btn-secondary staff-mobile-only" data-open-sidebar aria-controls="staff-navigation" aria-expanded="false">Menu</button>
                <span class="teacher-header-guild"><x-teacher.icon name="flag" /> {{ $teacher ? "Teacher's hub" : 'School Head hub' }} <span aria-hidden="true">/</span></span>
                <span class="staff-header-title">{{ $title }}</span>
            </div>
            <div class="staff-header-actions">
                <time datetime="{{ now()->toDateString() }}">{{ now()->format('D, M j') }}</time>
                <x-staff.status tone="success">{{ $teacher ? 'Teacher' : 'School Head' }}</x-staff.status>
                <form action="{{ route('logout') }}" method="POST">@csrf<button type="submit" class="btn-ghost">Sign out</button></form>
            </div>
        </header>

        <main id="workspace-main" class="staff-main" tabindex="-1">
            @if ($teacher && ! request()->routeIs('teacher.dashboard'))
                <div class="teacher-page-art" aria-hidden="true"><img src="{{ asset('assets/backgrounds/horizon-bg.png') }}" alt=""></div>
            @endif
            @if (request()->routeIs('teacher.students.show', 'teacher.sections.show'))
                @php $parent = request()->routeIs('teacher.students.show') ? 'students' : 'sections'; @endphp
                <nav class="staff-breadcrumbs" aria-label="Breadcrumb"><a href="{{ route('teacher.dashboard') }}">Dashboard</a><span aria-hidden="true">/</span><a href="{{ route('teacher.'.$parent.'.index') }}">{{ ucfirst($parent) }}</a><span aria-hidden="true">/</span><span aria-current="page">{{ $title }}</span></nav>
            @endif
            @if (session('status'))<div class="staff-notice" role="status">{{ session('status') }}</div>@endif
            @if ($errors->any())
                <div class="staff-error-summary" role="alert" tabindex="-1"><strong>Please review the highlighted fields.</strong><ul>@foreach ($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul></div>
            @endif
            {{ $slot }}
        </main>
    </div>

    <script id="staff-form-feedback" type="application/json">{!! json_encode(['errors' => $errors->messages(), 'old' => collect(session()->getOldInput())->except(['password', 'password_confirmation', '_token'])->all()], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) !!}</script>
    @stack('scripts')
    @livewireScriptConfig
</body>
</html>
