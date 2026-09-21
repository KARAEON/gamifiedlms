@props(['title' => null])

@php
    $title = $title ?? config('app.name', 'GLMS');
@endphp

@include('layouts.app', ['title' => $title, 'slot' => $slot])

