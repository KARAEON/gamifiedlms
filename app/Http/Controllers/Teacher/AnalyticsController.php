<?php

namespace App\Http\Controllers\Teacher;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\Topic;
use App\Models\User;
use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class AnalyticsController extends Controller
{
    public function index(Request $request, AnalyticsService $analyticsService): View
    {
        $filters = [
            'date_from' => $request->query('date_from', now()->subDays(30)->toDateString()),
            'date_to' => $request->query('date_to', now()->toDateString()),
            'student_id' => $request->query('student_id'),
            'section_id' => $request->query('section_id'),
            'lesson_id' => $request->query('lesson_id'),
            'topic_id' => $request->query('topic_id'),
            'activity_type' => $request->query('activity_type'),
        ];

        return view('teacher.analytics.index', [
            'filters' => $filters,
            'analytics' => $analyticsService->teacherAnalytics($filters),
            'students' => User::query()->where('role', UserRole::STUDENT)->orderBy('name')->get(['id', 'name']),
            'sections' => Section::query()->orderBy('name')->get(['id', 'name']),
            'lessons' => Lesson::query()->orderBy('title')->get(['id', 'title']),
            'topics' => Topic::query()->orderBy('title')->get(['id', 'title']),
        ]);
    }
}

