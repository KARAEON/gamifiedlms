<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\ScoreRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class ProgressController extends Controller
{
    public function index(Request $request): View
    {
        $student = $request->user();

        $trend = ScoreRecord::query()
            ->where('student_id', $student->id)
            ->selectRaw('DATE(attempted_at) as date, AVG(accuracy) as accuracy')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $topicProgress = ScoreRecord::query()
            ->where('student_id', $student->id)
            ->select('topic_id', DB::raw('AVG(accuracy) as avg_accuracy'), DB::raw('COUNT(*) as attempts'))
            ->with('topic.lesson')
            ->groupBy('topic_id')
            ->orderByDesc('avg_accuracy')
            ->get();

        return view('student.progress.index', [
            'trend' => $trend,
            'topicProgress' => $topicProgress,
        ]);
    }
}

