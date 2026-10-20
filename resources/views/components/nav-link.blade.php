@props([
    'href',
    'active' => false,
    'icon' => null,
])

@php
    $base = 'group relative flex items-center gap-3 rounded-[20px] px-3.5 py-3 text-sm font-semibold transition duration-300 ease-out';
    $state = $active
        ? 'bg-slate-900 text-white shadow-[0_20px_34px_-24px_rgba(15,23,42,0.65)]'
        : 'text-slate-600 hover:bg-white/85 hover:text-slate-900 hover:-translate-y-[1px]';

    $icons = [
        'D' => '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 13l9-8 9 8"/><path d="M5 11v9h14v-9"/><path d="M10 20v-5h4v5"/></svg>',
        'L' => '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4z"/><path d="M8 4v16"/><path d="M11 9h5"/><path d="M11 13h5"/></svg>',
        'S' => '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v14H4z"/><path d="M8 9h8"/><path d="M8 13h5"/><path d="M8 17h3"/></svg>',
        'P' => '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V8"/><path d="M9 20V4"/><path d="M14 20v-6"/><path d="M19 20V11"/></svg>',
        'U' => '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>',
        'ST' => '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M14 20a5 5 0 0 1 7 0"/></svg>',
        'GS' => '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 8h10a3 3 0 0 1 3 3v2a3 3 0 0 1-3 3h-1.5l-2 2.5-2-2.5H7a3 3 0 0 1-3-3v-2a3 3 0 0 1 3-3z"/><path d="M9.5 11.5v3"/><path d="M8 13h3"/><circle cx="15.5" cy="12.5" r=".8" fill="currentColor" stroke="none"/><circle cx="17.5" cy="14.5" r=".8" fill="currentColor" stroke="none"/></svg>',
        'SC' => '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="8" height="6" rx="1.2"/><rect x="13" y="4" width="8" height="6" rx="1.2"/><rect x="3" y="14" width="8" height="6" rx="1.2"/><rect x="13" y="14" width="8" height="6" rx="1.2"/></svg>',
        'LS' => '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h7a3 3 0 0 1 3 3v11H7a3 3 0 0 0-3 3V5z"/><path d="M20 5h-7a3 3 0 0 0-3 3v11h7a3 3 0 0 1 3 3V5z"/></svg>',
        'AC' => '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h10"/><circle cx="18" cy="17" r="2.5"/></svg>',
        'AN' => '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19h16"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-4"/></svg>',
        'IN' => '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7z"/><path d="M12 10v4"/><circle cx="12" cy="16.5" r=".6" fill="currentColor" stroke="none"/></svg>',
        'RP' => '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4"/><path d="M10 13h6"/><path d="M10 17h6"/></svg>',
        'PF' => '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.6-3 4-4.5 7-4.5S17.4 17 19 20"/><path d="M3 12h3"/><path d="M18 12h3"/></svg>',
    ];

    $icons['WF'] = '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/><path d="M10 6h7v8M6 10v7h8"/></svg>';
    $icons['PL'] = '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l8 4v5c0 5-4 8-8 9-4-1-8-4-8-9V7z"/><path d="m8 12 3 3 5-6"/></svg>';
    $icons['AU'] = '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
    $iconSvg = $icons[$icon] ?? $icons['D'];
@endphp

<a href="{{ $href }}" {{ $attributes->merge(['class' => $base.' '.$state]) }}>
    @if($active)
        <span class="absolute inset-y-2 left-1.5 w-1 rounded-full bg-white/80"></span>
    @endif
    <span aria-hidden="true" class="nav-icon {{ $active ? 'border-white/10 bg-white/10 text-white' : 'group-hover:border-slate-300 group-hover:bg-slate-50 group-hover:text-slate-700' }}">
        {!! $iconSvg !!}
    </span>
    <span>{{ $slot }}</span>
</a>
