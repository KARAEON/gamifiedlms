<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\QuestionBank;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ActivityController extends Controller
{
    public function show(Request $request, Activity $activity): View
    {
        $this->authorize('view', $activity);

        $activity->load(['topic.lesson', 'questions.choices']);
        if (in_array($activity->instructional_phase?->value, ['formative', 'summative'], true)) {
            $bank = QuestionBank::query()->where('topic_id', $activity->topic_id)->where('phase', $activity->instructional_phase->value)->with('questions.choices')->first();
            if ($bank) {
                $activity->setRelation('questions', $bank->questions);
                $activity->setAttribute('questions_per_attempt', $bank->questions_per_attempt);
            }
        }

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

