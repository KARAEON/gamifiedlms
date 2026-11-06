<x-app-layout title="School Term">
    <div class="space-y-6">
        <x-staff.page-heading title="School term" description="Set the quarter teachers use by default when entering grades." eyebrow="School management" />

        <section class="panel max-w-3xl p-6">
            <p class="text-sm text-slate-600">Current school quarter</p>
            <p class="mt-1 text-3xl font-semibold text-slate-900">Quarter {{ $currentQuarter }}</p>
            <p class="mt-2 text-sm text-slate-600">Changing this setting updates the default quarter on teacher grading pages. Teachers can still select other quarters, and students can still review all four.</p>

            <form method="POST" action="{{ route('admin.school-term.update') }}" class="mt-6 space-y-4">
                @csrf
                @method('PATCH')
                <fieldset>
                    <legend class="mb-2 text-sm font-semibold text-slate-800">Set current quarter</legend>
                    <div class="grid gap-3 sm:grid-cols-2">
                        @foreach ([3 => 'Third quarter (Q3)', 4 => 'Fourth quarter (Q4)'] as $quarter => $label)
                            <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 hover:border-brand-300">
                                <input type="radio" name="current_quarter" value="{{ $quarter }}" @checked($currentQuarter === $quarter) required>
                                <span class="font-medium text-slate-800">{{ $label }}</span>
                            </label>
                        @endforeach
                    </div>
                </fieldset>
                <button type="submit" class="btn-primary">Save current quarter</button>
            </form>
        </section>
    </div>
</x-app-layout>
