<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\StoreSectionRequest;
use App\Http\Requests\Teacher\UpdateSectionPhaserLocksRequest;
use App\Models\ScoreRecord;
use App\Models\Section;
use App\Services\PhaserLessonAccessService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class SectionController extends Controller
{
    public function index(Request $request): View
    {
        $allowedSectionIds = $request->user()->handledSections()->pluck('sections.id');

        $sections = Section::query()
            ->whereIn('id', $allowedSectionIds)
            ->withCount('students')
            ->orderBy('name')
            ->paginate(10);

        $performance = ScoreRecord::query()
            ->whereIn('section_id', $allowedSectionIds)
            ->select('section_id', DB::raw('AVG(accuracy) as avg_accuracy'), DB::raw('COUNT(*) as attempts'))
            ->groupBy('section_id')
            ->get()
            ->keyBy('section_id');

        return view('teacher.sections.index', [
            'sections' => $sections,
            'performance' => $performance,
        ]);
    }

    public function store(StoreSectionRequest $request): RedirectResponse
    {
        $payload = $request->validated();
        $payload['is_active'] = $request->boolean('is_active');

        $section = Section::query()->create($payload);
        $section->teachers()->syncWithoutDetaching([$request->user()->id]);

        return redirect()->route('teacher.sections.index')->with('status', 'Section created successfully.');
    }

    public function show(Request $request, Section $section, PhaserLessonAccessService $phaserLessonAccessService): View
    {
        $this->ensureTeacherOwnsSection($request, $section);

        $section->load(['students.user', 'teachers']);
        $scoreSummary = ScoreRecord::query()
            ->where('section_id', $section->id)
            ->selectRaw('AVG(accuracy) as average_accuracy, COUNT(*) as total_attempts')
            ->first();
        $topicBreakdown = ScoreRecord::query()
            ->where('section_id', $section->id)
            ->with('topic.lesson')
            ->select('topic_id', DB::raw('AVG(accuracy) as avg_accuracy'), DB::raw('COUNT(*) as attempts'))
            ->groupBy('topic_id')
            ->orderByDesc('avg_accuracy')
            ->get();

        return view('teacher.sections.show', [
            'section' => $section,
            'scoreSummary' => $scoreSummary,
            'topicBreakdown' => $topicBreakdown,
            'phaserAccessGroups' => $phaserLessonAccessService->sectionAccessGroups($section->id),
            'lockedMajorKeys' => $phaserLessonAccessService->lockedMajorKeysForSection($section->id),
            'lockedLessonKeys' => $phaserLessonAccessService->lockedLessonKeysForSection($section->id),
        ]);
    }

    public function update(StoreSectionRequest $request, Section $section): RedirectResponse
    {
        $this->ensureTeacherOwnsSection($request, $section);

        $payload = $request->validated();
        $payload['is_active'] = $request->boolean('is_active');

        $section->update($payload);

        return redirect()->route('teacher.sections.index')->with('status', 'Section updated successfully.');
    }

    public function updatePhaserLocks(
        UpdateSectionPhaserLocksRequest $request,
        Section $section,
        PhaserLessonAccessService $phaserLessonAccessService,
    ): RedirectResponse {
        $this->ensureTeacherOwnsSection($request, $section);

        $validated = $request->validated();
        $phaserLessonAccessService->syncLocks(
            $section,
            $validated['locked_majors'] ?? [],
            $validated['locked_lessons'] ?? [],
            $request->user()->id,
        );

        return redirect()
            ->route('teacher.sections.show', $section)
            ->with('status', 'Mini game map access updated.');
    }

    protected function ensureTeacherOwnsSection(Request $request, Section $section): void
    {
        abort_unless(
            $request->user()->handledSections()->whereKey($section->id)->exists(),
            404
        );
    }
}
