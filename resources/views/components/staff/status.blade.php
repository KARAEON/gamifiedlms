@props(['tone' => 'neutral'])
<span {{ $attributes->class(['badge', 'staff-status-'.$tone]) }}>{{ $slot }}</span>
