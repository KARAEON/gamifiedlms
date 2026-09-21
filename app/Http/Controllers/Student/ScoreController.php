<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\ScoreRecord;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ScoreController extends Controller
{
    public function index(Request $request): View
    {
        $student = $request->user();

        $records = ScoreRecord::query()
            ->where('student_id', $student->id)
            ->with(['lesson', 'topic', 'activity'])
            ->orderByDesc('attempted_at')
            ->paginate(12)
            ->withQueryString();

        return view('student.scores.index', [
            'records' => $records,
            'average' => round((float) ScoreRecord::query()->where('student_id', $student->id)->avg('accuracy'), 2),
        ]);
    }
}
