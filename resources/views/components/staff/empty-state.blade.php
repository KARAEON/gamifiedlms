@props(['title', 'description' => null])
<div {{ $attributes->class(['empty-state']) }}><strong>{{ $title }}</strong>@if ($description)<p>{{ $description }}</p>@endif{{ $slot }}</div>
