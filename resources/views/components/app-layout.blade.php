@props(['title' => null])

@php
    $title = $title ?? config('app.name', 'GLMS');
@endphp

@include(auth()->user()?->role?->value === 'student' ? 'layouts.app' : 'layouts.staff', ['title' => $title, 'slot' => $slot])

