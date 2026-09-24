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
</head>
@php
    $variant = $variant ?? 'apple';
    $isApple = $variant === 'apple';
    $bodyClass = $isApple
        ? "min-h-screen antialiased bg-slate-100 text-slate-900 [font-family:-apple-system,BlinkMacSystemFont,'Inter','Helvetica Neue',Arial,sans-serif]"
        : 'min-h-screen antialiased bg-slate-950 text-white';
    $wrapperClass = $isApple
        ? 'relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#fbfbfd_0%,#f5f5f7_62%,#eef2f7_100%)]'
        : 'relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_12%_15%,rgba(39,137,242,0.28),transparent_36%),radial-gradient(circle_at_90%_80%,rgba(15,58,150,0.32),transparent_42%),linear-gradient(135deg,#040b24_0%,#061336_40%,#03112f_100%)]';
    $showSchoolBrand = $showSchoolBrand ?? true;
@endphp
<body class="guest-workspace {{ $bodyClass }}">
    <div class="{{ $wrapperClass }} apple-shell">
        @if ($isApple)
            <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(255,255,255,0.96),transparent_45%),radial-gradient(circle_at_90%_92%,rgba(226,232,240,0.54),transparent_42%)]"></div>
            <div class="apple-glow parallax-layer left-[-4rem] top-12 h-72 w-72 bg-white/80" data-parallax="0.05"></div>
            <div class="apple-glow parallax-layer right-[-3rem] top-0 h-80 w-80 bg-sky-100/60" data-parallax="0.08"></div>
            <div class="hero-grid pointer-events-none absolute inset-x-0 top-0 h-[26rem] opacity-50"></div>
        @else
            <div class="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:42px_42px] opacity-20"></div>
            <div class="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-[110px]"></div>
            <div class="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-blue-500/15 blur-[130px]"></div>
            <div class="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-[120px]"></div>
        @endif

        <div class="relative z-10">
            @if ($showSchoolBrand)
                <a href="{{ route('landing') }}" class="school-brand-mark absolute left-5 top-5 z-20 sm:left-8 sm:top-7" aria-label="Catbalogan I SPED Center home">
                    <img src="{{ asset('images/branding/catbalogan-city-division-logo.png') }}" alt="Department of Education Division of Catbalogan City logo">
                    <span class="hidden sm:block">Catbalogan I<br>SPED Center</span>
                </a>
            @endif
            {{ $slot }}
        </div>
    </div>
</body>
</html>
