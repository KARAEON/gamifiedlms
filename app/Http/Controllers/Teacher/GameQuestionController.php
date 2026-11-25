<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Services\GameQuestionBankService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class GameQuestionController extends Controller
{
    public function update(Request $request, string $lesson, string $item, GameQuestionBankService $banks)
    {
        $assessment = $banks->assessments()[$lesson] ?? null;
        abort_unless($assessment && collect($assessment['items'])->contains('id', $item), 404);
        $data = $request->validate([
            'prompt' => ['required', 'string', 'max:5000'],
            'choices' => ['required', 'array', 'min:2', 'max:10'],
            'choices.*' => ['required', 'string', 'max:1000', 'distinct'],
            'answer' => ['required', 'string', Rule::in($request->input('choices', []))],
            'feedback' => ['required', 'string', 'max:5000'],
        ]);
        DB::table('game_question_overrides')->updateOrInsert(
            ['lesson_key' => $lesson, 'item_key' => $item],
            ['content' => json_encode($data, JSON_THROW_ON_ERROR), 'updated_at' => now(), 'created_at' => now()]
        );
        return redirect()->route('teacher.question-bank.index')->with('status', 'Game question updated. Students see the change when they reload the game.');
    }
}
