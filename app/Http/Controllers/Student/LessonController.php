<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\ScoreRecord;
use Illuminate\Http\Request;
use Illuminate\View\View;

class LessonController extends Controller
{
    public function index(Request $request): View
    {
        $student = $request->user();

        $lessons = Lesson::query()
            ->where('is_active', true)
            ->with(['topics.activities' => fn ($query) => $query->where('is_active', true)->orderBy('sort_order')])
            ->orderBy('title')
            ->paginate(6);

        $completedByActivity = ScoreRecord::query()
            ->where('student_id', $student->id)
            ->where('completion_status', 'completed')
            ->pluck('activity_id')
            ->unique();

        return view('student.lessons.index', [
            'lessons' => $lessons,
            'completedByActivity' => $completedByActivity,
        ]);
    }

    public function show(Request $request, Lesson $lesson): View
    {
        $student = $request->user();

        $lesson->load([
            'topics.activities' => fn ($query) => $query->where('is_active', true)->withCount('questions')->orderBy('sort_order'),
            'topics.questionBanks' => fn ($query) => $query->withCount('questions'),
        ]);

        foreach ($lesson->topics as $topic) {
            foreach ($topic->activities as $activity) {
                if (in_array($activity->instructional_phase?->value, ['formative', 'summative'], true)) {
                    $bank = $topic->questionBanks->firstWhere('phase', $activity->instructional_phase->value);
                    $activity->setAttribute('questions_count', $bank?->questions_count ?? 0);
                }
            }
        }

        $completedByActivity = ScoreRecord::query()
            ->where('student_id', $student->id)
            ->where('lesson_id', $lesson->id)
            ->where('completion_status', 'completed')
            ->pluck('activity_id')
            ->unique();

        return view('student.lessons.show', [
            'lesson' => $lesson,
            'completedByActivity' => $completedByActivity,
        ]);
    }
}

