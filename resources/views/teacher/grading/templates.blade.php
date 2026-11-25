<x-app-layout title="Excel Grade Templates">
    <div class="space-y-5">
        <section class="panel p-6">
            <a href="{{ route('teacher.grading.index') }}" class="text-sm font-semibold text-brand-800 underline">Back to Student Grading</a>
            <h1 class="mt-3 text-2xl font-semibold text-slate-900">Excel Grade Templates</h1>
            <p class="mt-1 text-sm text-slate-600">Upload an Excel workbook to use as a template. To edit it, download the file, make changes in Excel, and upload the updated file here.</p>
            @if ($errors->any())
                <div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{{ $errors->first() }}</div>
            @endif
        </section>

        <section class="panel p-5">
            <h2 class="text-lg font-semibold text-slate-900">Add a template</h2>
            <form method="POST" action="{{ route('teacher.grading.templates.store') }}" enctype="multipart/form-data" class="mt-4 flex flex-wrap items-end gap-3">
                @csrf
                <label class="min-w-56 flex-1 text-sm font-semibold text-slate-700">Template name
                    <input name="name" class="input-field mt-1" placeholder="Grade 6 Science class record" required maxlength="100">
                </label>
                <label class="min-w-56 flex-1 text-sm font-semibold text-slate-700">Excel file (.xlsx)
                    <input type="file" name="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="input-field mt-1" required>
                </label>
                <button type="submit" class="btn-primary">Upload template</button>
            </form>
        </section>

        @foreach ($templates as $template)
            <section class="panel p-5">
                <h2 class="text-lg font-semibold text-slate-900">{{ $template->name }}</h2>
                <p class="mt-1 text-sm text-slate-600">Used as the workbook for grade exports. GLMS fills the class-record sheets when the uploaded file has the supported Input Data and quarterly record layout. Every export also includes a GLMS Grades data sheet.</p>
                <a href="{{ route('teacher.grading.templates.download', $template) }}" class="mt-3 inline-block text-sm font-semibold text-brand-800 underline">Download template to edit</a>
                <form method="POST" action="{{ route('teacher.grading.templates.update', $template) }}" enctype="multipart/form-data" class="mt-4 flex flex-wrap items-end gap-3">
                    @csrf
                    @method('PUT')
                    <label class="min-w-56 flex-1 text-sm font-semibold text-slate-700">Template name
                        <input name="name" value="{{ $template->name }}" class="input-field mt-1" required maxlength="100">
                    </label>
                    <label class="min-w-56 flex-1 text-sm font-semibold text-slate-700">Replace Excel file (.xlsx)
                        <input type="file" name="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="input-field mt-1">
                    </label>
                    <button type="submit" class="btn-primary">Save template</button>
                </form>
                <form method="POST" action="{{ route('teacher.grading.templates.destroy', $template) }}" class="mt-4" onsubmit="return confirm('Delete this Excel template?')">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="text-sm font-semibold text-red-700 underline">Delete template</button>
                </form>
            </section>
        @endforeach
    </div>
</x-app-layout>
