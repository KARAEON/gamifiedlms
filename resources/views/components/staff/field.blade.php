@props(['name', 'label', 'type' => 'text', 'value' => null])
@php $fieldId = 'field-'.\Illuminate\Support\Str::uuid(); @endphp
<div class="staff-field"><label for="{{ $fieldId }}">{{ $label }}</label><input id="{{ $fieldId }}" name="{{ $name }}" type="{{ $type }}" value="{{ $value }}" {{ $attributes->class(['input-field']) }} ></div>
