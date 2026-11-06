<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SchoolTermController extends Controller
{
    public function index(): View
    {
        return view('admin.school-term.index', [
            'currentQuarter' => SchoolSetting::currentQuarter(),
        ]);
    }

    public function update(Request $request, AuditLogService $auditLogService): RedirectResponse
    {
        $validated = $request->validate([
            'current_quarter' => ['required', 'integer', 'in:3,4'],
        ]);

        $setting = SchoolSetting::query()->firstOrCreate(['id' => 1], ['current_quarter' => 1]);
        $previousQuarter = (int) $setting->current_quarter;
        $setting->update(['current_quarter' => (int) $validated['current_quarter']]);

        $auditLogService->log(
            $request->user(),
            'admin.school_term.updated',
            'school_setting',
            $setting->id,
            [
                'previous_quarter' => $previousQuarter,
                'current_quarter' => (int) $setting->current_quarter,
            ],
            $request
        );

        return redirect()->route('admin.school-term.index')->with('status', 'Current school quarter updated to Q'.$setting->current_quarter.'.');
    }
}
