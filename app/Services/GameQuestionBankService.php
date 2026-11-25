<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class GameQuestionBankService
{
    public function assessments(): array
    {
        $assessments = json_decode(file_get_contents(resource_path('game-assessments.json')), true, 512, JSON_THROW_ON_ERROR);
        $overrides = DB::table('game_question_overrides')->get()->keyBy(fn ($row) => $row->lesson_key.':'.$row->item_key);
        foreach ($assessments as $lesson => &$assessment) {
            $assessment['itemsPerAttempt'] = count($assessment['items']);
            $assessment['items'] = array_merge($assessment['items'], app(GameAssessmentPool::class)->additionalItems($lesson));
            foreach ($assessment['items'] as &$item) {
                if ($override = $overrides->get($lesson.':'.$item['id'])) {
                    $item = array_replace($item, json_decode($override->content, true, 512, JSON_THROW_ON_ERROR));
                }
            }
            unset($item);
        }
        unset($assessment);
        return $assessments;
    }
}
