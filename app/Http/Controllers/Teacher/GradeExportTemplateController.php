<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\GradeExportTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class GradeExportTemplateController extends Controller
{
    public function index(Request $request): View
    {
        return view('teacher.grading.templates', [
            'templates' => GradeExportTemplate::query()->where('teacher_id', $request->user()->id)
                ->where(fn ($query) => $query->whereNotNull('file_data')->orWhereNotNull('file_path'))
                ->orderBy('name')->get(['id', 'teacher_id', 'name', 'file_path']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'file' => ['required', 'file', 'mimes:xlsx', 'max:10240'],
        ]);
        $this->assertWorkbook($request->file('file')->getRealPath());
        GradeExportTemplate::query()->create([
            'teacher_id' => $request->user()->id,
            'name' => trim($validated['name']),
            'sheet_name' => 'GLMS Grades',
            'heading' => trim($validated['name']),
            'accent_color' => '#1E40AF',
            'columns' => array_map(
                fn (string $key, string $label) => ['key' => $key, 'label' => $label],
                array_keys(GradingController::EXPORT_COLUMNS), GradingController::EXPORT_COLUMNS
            ),
            'file_data' => base64_encode(file_get_contents($request->file('file')->getRealPath())),
        ]);

        return redirect()->route('teacher.grading.templates.index')->with('status', 'Excel template uploaded.');
    }

    public function update(Request $request, GradeExportTemplate $template): RedirectResponse
    {
        $this->assertOwned($request, $template);
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'file' => ['nullable', 'file', 'mimes:xlsx', 'max:10240'],
        ]);
        $oldPath = $template->file_path;
        $newData = null;
        if ($request->hasFile('file')) {
            $this->assertWorkbook($request->file('file')->getRealPath());
            $newData = base64_encode(file_get_contents($request->file('file')->getRealPath()));
        }
        $template->update([
            'name' => trim($validated['name']),
            'file_path' => $newData !== null ? null : $oldPath,
            'file_data' => $newData ?? $template->file_data,
        ]);
        if ($newData !== null && $oldPath) {
            Storage::disk('local')->delete($oldPath);
        }

        return redirect()->route('teacher.grading.templates.index')->with('status', 'Excel template updated.');
    }

    public function download(Request $request, GradeExportTemplate $template): BinaryFileResponse|StreamedResponse
    {
        $this->assertOwned($request, $template);
        $filename = (Str::slug($template->name) ?: 'grade-template').'.xlsx';
        if ($template->file_data !== null) {
            return response()->streamDownload(function () use ($template): void {
                echo base64_decode($template->file_data, true);
            }, $filename, ['Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
        }
        abort_unless($template->file_path && Storage::disk('local')->exists($template->file_path), 404);

        return response()->download(Storage::disk('local')->path($template->file_path),
            $filename);
    }

    public function destroy(Request $request, GradeExportTemplate $template): RedirectResponse
    {
        $this->assertOwned($request, $template);
        $path = $template->file_path;
        $template->delete();
        if ($path) {
            Storage::disk('local')->delete($path);
        }

        return redirect()->route('teacher.grading.templates.index')->with('status', 'Excel template deleted.');
    }

    private function assertOwned(Request $request, GradeExportTemplate $template): void
    {
        abort_unless($template->teacher_id === $request->user()->id, 404);
    }

    private function assertWorkbook(string $path): void
    {
        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            throw ValidationException::withMessages(['file' => 'Upload a valid .xlsx workbook.']);
        }
        $valid = $zip->locateName('xl/workbook.xml') !== false
            && $zip->locateName('[Content_Types].xml') !== false;
        $zip->close();
        if (! $valid) {
            throw ValidationException::withMessages(['file' => 'Upload a valid .xlsx workbook.']);
        }
    }

}
