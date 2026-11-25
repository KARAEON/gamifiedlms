<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Lesson;
use App\Models\PhaserGameResult;
use App\Models\ScoreRecord;
use App\Models\Topic;
use Illuminate\Support\Collection;

class GameAnalyticsRecords
{
    public function records(array $filters = []): Collection
    {
        $query = PhaserGameResult::query()->with(['student.studentProfile.section', 'section'])
            ->where('entry_type', 'assessment')->where('phase', 'formative');
        foreach (['date_from' => '>=', 'date_to' => '<='] as $key => $operator) {
            if (! empty($filters[$key])) {
                $query->whereDate('completed_at', $operator, $filters[$key]);
            }
        }
        foreach (['student_id', 'section_id'] as $key) {
            if (! empty($filters[$key])) {
                $query->where($key, $filters[$key]);
            }
        }
        if (isset($filters['section_ids'])) {
            $query->whereIn('section_id', $filters['section_ids']);
        }
        if (! empty($filters['teacher_id'])) {
            $query->whereHas('section.teachers', fn ($q) => $q->where('users.id', $filters['teacher_id']));
        }
        if (! empty($filters['grade_keyword'])) {
            $query->whereHas('section', fn ($q) => $q->where('name', 'like', '%'.$filters['grade_keyword'].'%'));
        }

        return $query->get()->map(function (PhaserGameResult $result): ScoreRecord {
            // Negative IDs keep game lessons separate from database curriculum IDs.
            $id = -((int) sprintf('%u', crc32($result->lesson_key)) + 1);
            $subject = str_starts_with($result->lesson_key, 'reading-island') ? 'English'
                : (str_starts_with($result->lesson_key, 'numeric-ruins') ? 'Mathematics' : 'Science');
            $lesson = new Lesson(['title' => $result->lesson_title, 'subject' => $subject]);
            $lesson->id = $id;
            $topic = new Topic(['title' => $result->topic_title.' — '.$result->lesson_title]);
            $topic->id = $id;
            $topic->setRelation('lesson', $lesson);
            $record = new ScoreRecord([
                'student_id' => $result->student_id, 'section_id' => $result->section_id,
                'lesson_id' => $id, 'topic_id' => $id, 'activity_id' => $id,
                'accuracy' => $result->accuracy, 'score' => $result->score, 'max_score' => $result->max_score,
                'attempted_at' => $result->completed_at, 'completion_status' => 'completed',
            ]);
            return $record->setRelation('student', $result->student)->setRelation('section', $result->section)
                ->setRelation('lesson', $lesson)->setRelation('topic', $topic)
                ->setRelation('activity', new Activity(['title' => $result->game_title, 'activity_type' => 'multiple_choice', 'instructional_phase' => 'formative']));
        })->filter(function (ScoreRecord $record) use ($filters): bool {
            foreach (['lesson_id', 'topic_id'] as $key) {
                if (! empty($filters[$key]) && (int) $filters[$key] !== $record->$key) {
                    return false;
                }
            }
            return (empty($filters['subject']) || $filters['subject'] === $record->lesson->subject)
                && (empty($filters['activity_type']) || $filters['activity_type'] === 'multiple_choice');
        })->values();
    }
}
