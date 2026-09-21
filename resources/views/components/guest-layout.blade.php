@props([
    'title' => null,
    'variant' => 'dark',
])

@php
    $title = $title ?? config('app.name', 'GLMS');
@endphp

@include('layouts.guest', [
    'title' => $title,
    'variant' => $variant,
    'slot' => $slot,
])
