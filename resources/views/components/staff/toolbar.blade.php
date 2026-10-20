@props(['title' => 'Filters'])
<section {{ $attributes->class(['filter-panel']) }} aria-label="{{ $title }}">{{ $slot }}</section>
