<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\GradeComputationService;
use App\Models\SchoolSetting;
use Illuminate\Http\Request;
use Illuminate\View\View;

class GradingController extends Controller
{
    public function __invoke(Request $request, GradeComputationService $gradeComputationService): View
    {
        return view('student.grading.index', [
            'subjects' => $gradeComputationService->computeAllSubjects($request->user()),
            'currentQuarter' => SchoolSetting::currentQuarter(),
        ]);
    }
}
