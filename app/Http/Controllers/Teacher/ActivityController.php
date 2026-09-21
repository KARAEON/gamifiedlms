<?php

namespace App\Http\Controllers\Teacher;

use App\Enums\ActivityPhase;
use App\Enums\ActivityType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\StoreActivityRequest;
use App\Models\Activity;
use App\Models\Question;
use App\Models\Topic;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ActivityController extends Controller
{
    public function index(Request $request): View
    {
        $query = Activity::query()
            ->with(['topic.lesson'])
            ->withCount('questions')
            ->orderByDesc('created_at');

        if ($request->filled('activity_type')) {
            $query->where('activity_type', (string) $request->query('activity_type'));
        }

        if ($request->filled('instructional_phase')) {
            $query->where('instructional_phase', (string) $request->query('instructional_phase'));
        }

        if ($request->filled('topic_id')) {
            $query->where('topic_id', (int) $request->query('topic_id'));
        }

        return view('teacher.activities.index', [
            'activities' => $query->paginate(12)->withQueryString(),
            'topics' => Topic::query()->with('lesson')->orderBy('title')->get(),
            'types' => ActivityType::labels(),
            'phases' => ActivityPhase::labels(),
        ]);
    }

    public function store(StoreActivityRequest $request, AuditLogService $auditLogService): RedirectResponse
    {
        $payload = $request->validated();
        $payload['is_active'] = $request->boolean('is_active');
        $payload['allow_retry'] = $request->boolean('allow_retry');

        $activity = Activity::query()->create($payload);
        $auditLogService->log(
            $request->user(),
            'teacher.activity.created',
            'activity',
            $activity->id,
            [
                'topic_id' => $activity->topic_id,
                'instructional_phase' => $activity->instructional_phase?->value,
            ],
            $request
        );

        return redirect()->route('teacher.activities.index')->with('status', 'Activity created successfully.');
    }

    public function update(StoreActivityRequest $request, Activity $activity, AuditLogService $auditLogService): RedirectResponse
    {
        $payload = $request->validated();
        $payload['is_active'] = $request->boolean('is_active');
        $payload['allow_retry'] = $request->boolean('allow_retry');

        $activity->update($payload);
        $auditLogService->log(
            $request->user(),
            'teacher.activity.updated',
            'activity',
            $activity->id,
            [
                'topic_id' => $activity->topic_id,
                'instructional_phase' => $activity->instructional_phase?->value,
            ],
            $request
        );

        return redirect()->route('teacher.activities.index')->with('status', 'Activity updated successfully.');
    }

    public function addQuestion(Request $request, Activity $activity, AuditLogService $auditLogService): RedirectResponse
    {
        $validated = $request->validate([
            'prompt' => ['required', 'string'],
            'question_type' => ['required', 'string'],
            'correct_answer' => ['nullable', 'string'],
            'points' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $question = Question::query()->create([
            'activity_id' => $activity->id,
            'prompt' => $validated['prompt'],
            'question_type' => $validated['question_type'],
            'correct_answer' => $validated['correct_answer'] ?? null,
            'points' => $validated['points'],
            'sort_order' => ($activity->questions()->max('sort_order') ?? 0) + 1,
        ]);
        $auditLogService->log(
            $request->user(),
            'teacher.activity.question_added',
            'question',
            $question->id,
            [
                'activity_id' => $activity->id,
            ],
            $request
        );

        return redirect()->route('teacher.activities.index')->with('status', 'Question added to activity.');
    }
}
