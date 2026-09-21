<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Services\PhaserLessonAccessService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __invoke(Request $request, PhaserLessonAccessService $phaserLessonAccessService): View
    {
        $student = $request->user()->load('studentProfile.section');

        return view('student.dashboard', [
            'student' => $student,
            'phaserContext' => [
                'submitUrl' => route('student.phaser-results.store'),
                'csrfToken' => csrf_token(),
                ...$phaserLessonAccessService->runtimeAccessForSection($student->studentProfile?->section_id),
                'lockedMessage' => PhaserLessonAccessService::LOCKED_MESSAGE,
            ],
        ]);
    }
}
