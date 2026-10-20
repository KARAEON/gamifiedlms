<x-app-layout title="Student Management">
    <div  class="space-y-6">
        <x-staff.page-heading title="Student Management" description="Manage student accounts, sections, and learning readiness." eyebrow="Teaching and learning"><button data-open-dialog="create-students" type="button" class="btn-primary">Add Student</button></x-staff.page-heading>

        <section class="filter-panel">
            <h2 class="section-title mb-4">Student directory</h2>
            <form class="grid gap-3 md:grid-cols-4">
                <input type="text" name="search" value="{{ request('search') }}" placeholder="Search name or email" class="input-field">
                <select name="section_id" class="input-field">
                    <option value="">All sections</option>
                    @foreach ($sections as $section)
                        <option value="{{ $section->id }}" @selected(request('section_id') == $section->id)>{{ $section->name }}</option>
                    @endforeach
                </select>
                <select name="status" class="input-field">
                    <option value="">Any status</option>
                    <option value="active" @selected(request('status') === 'active')>Active</option>
                    <option value="inactive" @selected(request('status') === 'inactive')>Archived</option>
                </select>
                <button class="btn-primary">Apply Filters</button>
            </form>
            <p class="mt-3 text-xs text-slate-500">Tip: combine section + status to quickly find learners needing profile updates.</p>
        </section>

        <section class="panel p-5">
            <div class="table-wrap mt-5">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Email</th>
                            <th scope="col">Section</th>
                            <th scope="col">Status</th>
                            <th scope="col">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($students as $student)
                            <tr>
                                <td class="py-3 font-medium text-slate-800">{{ $student->name }}</td>
                                <td class="py-3 text-slate-600">{{ $student->email }}</td>
                                <td class="py-3 text-slate-600">{{ $student->studentProfile?->section?->name ?? 'Unassigned' }}</td>
                                <td class="py-3">
                                    @if ($student->is_active)
                                        <span class="badge bg-emerald-100 text-emerald-700">Active</span>
                                    @else
                                        <span class="badge bg-slate-200 text-slate-700">Archived</span>
                                    @endif
                                </td>
                                <td class="py-3">
                                    <div class="flex items-center gap-2">
                                        <a href="{{ route('teacher.students.show', $student) }}" class="btn-secondary px-3 py-1.5 text-xs">View</a>
                                        @if ($student->is_active)
                                            <form action="{{ route('teacher.students.archive', $student) }}" method="POST" data-confirm-archive>
                                                @csrf
                                                @method('PATCH')
                                                <button class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">Archive</button>
                                            </form>
                                        @endif
                                    </div>
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="5" class="py-6">
                                    <x-staff.empty-state title="No learners match these filters" description="Try another name, section, or status, or reset the directory filters." />
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <div class="mt-4">
                {{ $students->links() }}
            </div>
        </section>

<x-staff.dialog id="create-students" title="Add student">
<form method="POST" action="{{ route('teacher.students.store') }}" class="grid gap-3 sm:grid-cols-2">
                    @csrf
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Last Name</label>
                        <input type="text" name="last_name" class="input-field" required>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">First Name</label>
                        <input type="text" name="first_name" class="input-field" required>
                    </div>
                    <div class="sm:col-span-2">
                        <label class="mb-1 block text-sm font-medium text-slate-700">Middle Name</label>
                        <input type="text" name="middle_name" class="input-field">
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Email</label>
                        <input type="email" name="email" class="input-field" required>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Section</label>
                        <select name="section_id" class="input-field" required>
                            <option value="">Select section</option>
                            @foreach ($sections as $section)
                                <option value="{{ $section->id }}">{{ $section->name }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Learner Reference</label>
                        <input type="text" name="learner_reference" class="input-field">
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Guardian Name</label>
                        <input type="text" name="guardian_name" class="input-field">
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-medium text-slate-700">Learning Goal</label>
                        <input type="text" name="learning_goal" class="input-field">
                    </div>
                    <div class="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        Students will sign in using their section join code and name. No student password is created here.
                    </div>
                    <div class="sm:col-span-2 flex justify-end gap-2 pt-2">
                        <button type="button" data-close-dialog class="btn-secondary">Cancel</button>
                        <button type="submit" class="btn-primary">Create Student</button>
                    </div>
                </form>
</x-staff.dialog>
    </div>
</x-app-layout>
