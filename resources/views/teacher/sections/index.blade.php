<x-app-layout title="Section Management">
    <div  class="space-y-6">
        <x-staff.page-heading title="Section Management" description="Create sections and monitor class-level performance." eyebrow="Teaching and learning"><button data-open-dialog="create-sections" type="button" class="btn-primary">Create Section</button></x-staff.page-heading>

        <section class="panel p-5">
            <div class="table-wrap">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th scope="col">Section</th>
                            <th scope="col">Join Code</th>
                            <th scope="col">Students</th>
                            <th scope="col">Average Accuracy</th>
                            <th scope="col">Attempts</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($sections as $section)
                            @php
                                $sectionStats = $performance->get($section->id);
                            @endphp
                            <tr>
                                <td class="py-3 font-semibold text-slate-900">{{ $section->name }}</td>
                                <td class="py-3 text-slate-600">{{ $section->code }}</td>
                                <td class="py-3 text-slate-600">{{ $section->students_count }}</td>
                                <td class="py-3 text-slate-600">{{ number_format((float) ($sectionStats->avg_accuracy ?? 0), 1) }}%</td>
                                <td class="py-3 text-slate-600">{{ $sectionStats->attempts ?? 0 }}</td>
                                <td class="py-3">
                                    <a href="{{ route('teacher.sections.show', $section) }}" class="btn-secondary px-3 py-1.5 text-xs">View Details</a>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="6" class="py-6">
                                    <x-staff.empty-state title="Create your first section" description="Organize learners into classes and share a section join code." />
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
            <div class="mt-4">{{ $sections->links() }}</div>
        </section>

<x-staff.dialog id="create-sections" title="Create section">
<form method="POST" action="{{ route('teacher.sections.store') }}" class="space-y-3">
                    @csrf
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Section Name</label>
                        <input type="text" name="name" class="input-field" placeholder="Grade 6 - Aster" required>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Join Code</label>
                        <input type="text" name="code" class="input-field" placeholder="G6-A" required>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Description</label>
                        <textarea name="description" rows="3" class="input-field"></textarea>
                    </div>
                    <label class="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" name="is_active" value="1" class="h-4 w-4 rounded border-slate-300 text-brand-600" checked>
                        Active section
                    </label>
                    <div class="flex justify-end gap-2 pt-1">
                        <button type="button" data-close-dialog class="btn-secondary">Cancel</button>
                        <button class="btn-primary">Create Section</button>
                    </div>
                </form>
</x-staff.dialog>
    </div>
</x-app-layout>
