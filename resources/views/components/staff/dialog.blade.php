@props(['id', 'title'])
<dialog id="{{ $id }}" class="staff-dialog" aria-labelledby="{{ $id }}-title"><header class="staff-dialog-header"><h2 id="{{ $id }}-title">{{ $title }}</h2><button type="button" class="btn-ghost" data-close-dialog aria-label="Close {{ $title }}">&times;</button></header><div class="staff-dialog-content">{{ $slot }}</div></dialog>
