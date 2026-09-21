<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ActivityController extends Controller
{
    public function show(Request $request, Activity $activity): View
    {
        $this->authorize('view', $activity);

        $activity->load(['topic.lesson', 'questions.choices']);

        $latestAttempt = $request->user()
            ->attempts()
            ->where('activity_id', $activity->id)
            ->latest('completed_at')
            ->first();

        return view('student.activities.show', [
            'activity' => $activity,
            'latestAttempt' => $latestAttempt,
        ]);
    }
}

