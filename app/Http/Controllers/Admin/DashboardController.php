<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\User;
use App\Services\AdminAnalyticsService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __invoke(Request $request, AdminAnalyticsService $analyticsService, AuditLogService $auditLogService): View
    {
        $filters = [
            'date_from' => $request->query('date_from', now()->subDays(30)->toDateString()),
            'date_to' => $request->query('date_to', now()->toDateString()),
            'section_id' => $request->query('section_id'),
            'teacher_id' => $request->query('teacher_id'),
            'subject' => $request->query('subject'),
            'grade_keyword' => $request->query('grade_keyword'),
        ];

        $subjects = \App\Models\Lesson::query()
            ->select('subject')
            ->whereNotNull('subject')
            ->distinct()
            ->orderBy('subject')
            ->pluck('subject');

        $auditLogService->log(
            $request->user(),
            'admin.dashboard.viewed',
            'analytics_dashboard',
            null,
            array_filter($filters, fn ($value): bool => $value !== null && $value !== ''),
            $request
        );

        return view('admin.dashboard', [
            'filters' => $filters,
            'analytics' => $analyticsService->dashboard($filters),
            'sections' => Section::query()->orderBy('name')->get(['id', 'name']),
            'teachers' => User::query()->where('role', UserRole::TEACHER)->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'subjects' => $subjects,
        ]);
    }
}
