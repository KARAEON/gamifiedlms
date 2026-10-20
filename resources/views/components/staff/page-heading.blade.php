@props(['title', 'description' => null, 'eyebrow' => 'Academic workspace'])
<section {{ $attributes->class(['staff-page-heading']) }}><div><p class="section-kicker">{{ $eyebrow }}</p><h1>{{ $title }}</h1>@if ($description)<p class="section-copy">{{ $description }}</p>@endif</div>@if ($slot->isNotEmpty())<div class="staff-page-actions">{{ $slot }}</div>@endif</section>
