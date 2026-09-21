<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class DemoDataPurgeService
{
    /**
     * @return array<string, int>
     */
    public function purge(): array
    {
        return DB::transaction(function (): array {
            $demoUserIds = DB::table('users')
                ->where('email', 'like', '%@glms.test')
                ->pluck('id')
                ->all();

            $demoSectionIds = DB::table('sections')
                ->whereIn('code', ['G6-A', 'G6-J', 'G6-O'])
                ->pluck('id')
                ->all();

            $demoLessonIds = DB::table('lessons')
                ->whereIn('title', [
                    'Earth and Space Systems',
                    'Living Things and Ecosystems',
                    'Matter, Energy, and Motion',
                ])
                ->pluck('id')
                ->all();

            $reportsDeleted = DB::table('reports')
                ->where('title', 'Quarter 1 Science Analytics Summary')
                ->orWhereIn('generated_by', $demoUserIds ?: [0])
                ->delete();

            $lessonsDeleted = empty($demoLessonIds)
                ? 0
                : DB::table('lessons')->whereIn('id', $demoLessonIds)->delete();

            $sectionsDeleted = empty($demoSectionIds)
                ? 0
                : DB::table('sections')->whereIn('id', $demoSectionIds)->delete();

            $usersDeleted = empty($demoUserIds)
                ? 0
                : DB::table('users')->whereIn('id', $demoUserIds)->delete();

            return [
                'reports' => $reportsDeleted,
                'lessons' => $lessonsDeleted,
                'sections' => $sectionsDeleted,
                'users' => $usersDeleted,
            ];
        });
    }
}
