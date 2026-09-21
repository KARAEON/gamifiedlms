<?php

namespace App\Http\Controllers\Teacher;

use App\Enums\ActivityPhase;
use App\Enums\ActivityType;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Section;
use App\Models\User;
use App\Services\TeacherScoreFeedService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\View\View;

class ScoreController extends Controller
{
    public function __construct(
        private readonly TeacherScoreFeedService $teacherScoreFeedService,
    ) {
    }

    public function index(Request $request): View
    {
        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'source' => (string) $request->query('source', 'all'),
            'result_type' => (string) $request->query('result_type', ''),
            'section_id' => $request->query('section_id'),
            'student_id' => $request->query('student_id'),
            'activity_id' => $request->query('activity_id'),
            'activity_type' => $request->query('activity_type'),
            'instructional_phase' => $request->query('instructional_phase'),
            'date_from' => $request->query('date_from', now()->subDays(30)->toDateString()),
            'date_to' => $request->query('date_to', now()->toDateString()),
        ];

        $allowedSectionIds = $this->allowedSectionIds($request->user());

        $sectionsQuery = Section::query()->orderBy('name');
        if ($allowedSectionIds->isNotEmpty()) {
            $sectionsQuery->whereIn('id', $allowedSectionIds);
        }
        $sections = $sectionsQuery->get(['id', 'name']);

        $studentsQuery = User::query()
            ->where('role', UserRole::STUDENT)
            ->where('is_active', true)
            ->orderBy('name');

        if ($allowedSectionIds->isNotEmpty()) {
            $studentsQuery->whereHas('studentProfile', fn ($builder) => $builder->whereIn('section_id', $allowedSectionIds));
        }

        $students = $studentsQuery->get(['id', 'name']);
        $activities = Activity::query()->orderBy('title')->get(['id', 'title', 'activity_type']);
        $feed = $this->teacherScoreFeedService->build(
            $filters,
            $allowedSectionIds,
            max(1, (int) $request->query('page', 1)),
        );

        return view('teacher.scores.index', [
            'filters' => $filters,
            'sections' => $sections,
            'students' => $students,
            'activities' => $activities,
            'records' => $feed['records'],
            'activityTypeLabels' => ActivityType::labels(),
            'activityPhaseLabels' => ActivityPhase::labels(),
            'summary' => $feed['summary'],
        ]);
    }

    private function allowedSectionIds(User $teacher): Collection
    {
        return $teacher->handledSections()->pluck('sections.id');
    }
}
