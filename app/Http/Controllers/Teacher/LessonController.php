<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\StoreLessonRequest;
use App\Models\Lesson;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class LessonController extends Controller
{
    public function index(Request $request): View
    {
        $lessons = Lesson::query()
            ->withCount('topics')
            ->with(['topics' => fn ($query) => $query->withCount('activities')->orderBy('title')])
            ->orderBy('title')
            ->paginate(8);

        return view('teacher.lessons.index', [
            'lessons' => $lessons,
        ]);
    }

    public function store(StoreLessonRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['is_active'] = $request->boolean('is_active');
        $validated['created_by'] = $request->user()->id;
        $validated['published_at'] = now();

        Lesson::query()->create($validated);

        return redirect()->route('teacher.lessons.index')->with('status', 'Lesson created successfully.');
    }

    public function update(StoreLessonRequest $request, Lesson $lesson): RedirectResponse
    {
        $validated = $request->validated();
        $validated['is_active'] = $request->boolean('is_active');

        $lesson->update($validated);

        return redirect()->route('teacher.lessons.index')->with('status', 'Lesson updated successfully.');
    }
}
