<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __invoke(Request $request, AnalyticsService $analyticsService): View
    {
        $filters = [
            'date_from' => $request->query('date_from', now()->subDays(30)->toDateString()),
            'date_to' => $request->query('date_to', now()->toDateString()),
        ];

        $analytics = $analyticsService->teacherAnalytics($filters);

        return view('teacher.dashboard', [
            'analytics' => $analytics,
            'filters' => $filters,
        ]);
    }
}

