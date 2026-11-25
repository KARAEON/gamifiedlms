<?php

namespace Tests\Feature;

use App\Models\PhaserGameResult;
use App\Models\Activity;
use App\Models\Attempt;
use App\Models\Lesson;
use App\Models\ScoreRecord;
use App\Models\Section;
use App\Models\SectionPhaserMajorLock;
use App\Models\SectionPhaserLessonLock;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\GradeComputationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use ZipArchive;

class StudentPhaserResultTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_formative_test_score_appears_in_science_written_works_and_export(): void
    {
        Carbon::setTestNow('2026-11-26 12:00:00');

        try {
            [$student, $section] = $this->buildStudent();
            $teacher = User::factory()->teacher()->create();
            $section->teachers()->attach($teacher->id);

            $this->actingAs($student)->postJson(route('student.phaser-results.store'), [
                'submission_uuid' => '0f9e92c9-2136-469c-8db3-ea0dc2f94436',
                'entry_type' => 'assessment',
                'lesson_key' => 'q1-m1-l1',
                'game_key' => 'ft-q1-mixtures-l1',
                'payload' => [
                    'answers' => [
                        'l1-1' => 'Uniform Mixture',
                        'l1-2' => 'Uniform Mixture',
                        'l1-3' => 'Its parts are visible',
                        'l1-4' => 'Components can be seen separately',
                        'l1-5' => 'Uniform - Salt Water - Same throughout',
                    ],
                ],
            ])->assertCreated();

            $result = PhaserGameResult::query()->where('phase', 'formative')->sole();
            PhaserGameResult::query()->create([
                'student_id' => $student->id,
                'section_id' => $section->id,
                'lesson_key' => 'q1-m1-l1',
                'lesson_title' => 'Mixtures 1',
                'game_key' => 'mix-match-memory-quest',
                'entry_type' => 'minigame',
                'phase' => 'gamified',
                'game_title' => 'MIX MATCH MEMORY QUEST',
                'topic_title' => 'Q1 MATTER - MIXTURES',
                'submission_uuid' => 'c7b8c0a7-32ef-4ce7-9004-f5a0d1cf1f81',
                'attempt_number' => 1,
                'score' => 120,
                'max_score' => 150,
                'accuracy' => 80,
                'result_status' => 'win',
                'payload' => ['input' => [], 'derived' => []],
                'completed_at' => now(),
            ]);
            $grades = app(GradeComputationService::class);
            $scienceQ1 = $grades->computeForStudentSubjectQuarter($student, 'Science', 1);
            $scienceQ4 = $grades->computeForStudentSubjectQuarter($student, 'Science', 4);
            $englishQ1 = $grades->computeForStudentSubjectQuarter($student, 'English', 1);

            $this->assertEquals($result->score, $scienceQ1['written_works']['total']);
            $this->assertEquals($result->max_score, $scienceQ1['written_works']['hps_total']);
            $this->assertSame(0, $scienceQ4['written_works']['hps_total']);
            $this->assertSame(0, $englishQ1['written_works']['hps_total']);

            $this->actingAs($teacher)
                ->get(route('teacher.grading.index', [
                    'section_id' => $section->id,
                    'subject' => 'Science',
                    'quarter' => 1,
                ]))
                ->assertOk()
                ->assertSee((string) $result->score)
                ->assertSee((string) $result->max_score);

            $export = $this->actingAs($teacher)->get(route('teacher.grading.export', [
                'section_id' => $section->id,
                'subject' => 'Science',
                'quarter' => 1,
            ]));
            $export->assertOk();
            $zip = new ZipArchive();
            $this->assertTrue($zip->open($export->baseResponse->getFile()->getPathname()));
            $inputSheet = $zip->getFromName('xl/worksheets/sheet1.xml');
            $quarterSheet = $zip->getFromName('xl/worksheets/sheet2.xml');
            $workbook = $zip->getFromName('xl/workbook.xml');
            $this->assertFalse($zip->getFromName('xl/worksheets/sheet11.xml'));
            $zip->close();
            $this->assertIsString($inputSheet);
            $this->assertIsString($quarterSheet);
            $this->assertIsString($workbook);
            $this->assertStringContainsString($student->name, $inputSheet);
            $this->assertStringContainsString('SCIENCE_Q1', $workbook);
            $this->assertStringContainsString('GLMS Grades', $workbook);
            $this->assertStringNotContainsString('Wileover F Gordove', $inputSheet);

            $quarterDocument = new \DOMDocument();
            $this->assertTrue($quarterDocument->loadXML($quarterSheet));
            $xpath = new \DOMXPath($quarterDocument);
            $xpath->registerNamespace('s', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
            $this->assertSame((string) $result->score, $xpath->evaluate('string(//s:c[@r="P12"]/s:v)'));
            $this->assertSame((string) $result->accuracy, $xpath->evaluate('string(//s:c[@r="Q12"]/s:v)'));
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_normal_game_result_is_not_recorded(): void
    {
        [$student, $section] = $this->buildStudent();

        $response = $this->actingAs($student)->postJson(route('student.phaser-results.store'), [
            'submission_uuid' => 'c7b8c0a7-32ef-4ce7-9004-f5a0d1cf1f81',
            'entry_type' => 'minigame',
            'lesson_key' => 'q1-m1-l1',
            'game_key' => 'mix-match-memory-quest',
            'payload' => [
                'matched_set_count' => 4,
                'fast_match_count' => 2,
                'finished_all' => true,
                'time_remaining_seconds' => 18.4,
            ],
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['entry_type']);
        $this->assertDatabaseCount('phaser_game_results', 0);
    }

    public function test_summative_test_is_not_recorded_as_a_formative_test(): void
    {
        [$student] = $this->buildStudent();

        $this->actingAs($student)->postJson(route('student.phaser-results.store'), [
            'submission_uuid' => 'fb5fe76a-4914-4dc5-9413-80d6686d0d8f',
            'entry_type' => 'assessment',
            'lesson_key' => 'q1-m1-l5',
            'game_key' => 'st-q1-mixtures',
            'payload' => ['answers' => []],
        ])->assertStatus(422)->assertJsonValidationErrors(['entry_type']);

        $this->assertDatabaseCount('phaser_game_results', 0);
    }

    public function test_regular_game_activity_score_does_not_contribute_to_written_works(): void
    {
        Carbon::setTestNow('2026-02-15 12:00:00');

        try {
            [$student, $section] = $this->buildStudent();
            $lesson = Lesson::factory()->create(['subject' => 'Science']);
            $game = Activity::factory()->create(['instructional_phase' => 'gamified']);
            $formativeTest = Activity::factory()->create(['instructional_phase' => 'formative']);

            foreach ([[$game, 90], [$formativeTest, 4]] as [$activity, $score]) {
                ScoreRecord::factory()->create([
                    'student_id' => $student->id,
                    'section_id' => $section->id,
                    'lesson_id' => $lesson->id,
                    'activity_id' => $activity->id,
                    'attempt_id' => Attempt::factory()->create([
                        'student_id' => $student->id,
                        'section_id' => $section->id,
                        'activity_id' => $activity->id,
                    ])->id,
                    'score' => $score,
                    'max_score' => $activity->id === $game->id ? 100 : 5,
                    'attempted_at' => now(),
                ]);
            }

            $writtenWorks = app(GradeComputationService::class)
                ->computeForStudentSubjectQuarter($student, 'Science', 1)['written_works'];

            $this->assertEquals(4, $writtenWorks['total']);
            $this->assertEquals(5, $writtenWorks['hps_total']);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_duplicate_submission_uuid_returns_the_existing_result(): void
    {
        [$student] = $this->buildStudent();

        $payload = [
            'submission_uuid' => '66f65d11-e4d7-4411-bb39-51ef9d2fa413',
            'entry_type' => 'assessment',
            'lesson_key' => 'q1-m1-l1',
            'game_key' => 'ft-q1-mixtures-l1',
            'payload' => [
                'answers' => [
                    'l1-1' => 'Uniform Mixture',
                    'l1-2' => 'Uniform Mixture',
                    'l1-3' => 'Its parts are visible',
                    'l1-4' => 'Components can be seen separately',
                    'l1-5' => 'Uniform - Salt Water - Same throughout',
                ],
            ],
        ];

        $this->actingAs($student)->postJson(route('student.phaser-results.store'), $payload)->assertCreated();
        $secondResponse = $this->actingAs($student)->postJson(route('student.phaser-results.store'), $payload);

        $secondResponse->assertOk()
            ->assertJson([
                'stored' => true,
                'created' => false,
                'result_status' => 'pass',
                'attempt_number' => 1,
            ]);

        $this->assertSame(1, PhaserGameResult::query()->count());
    }

    public function test_locked_lesson_rejects_a_new_phaser_submission(): void
    {
        [$student, $section] = $this->buildStudent();

        SectionPhaserLessonLock::query()->create([
            'section_id' => $section->id,
            'lesson_key' => 'q1-m1-l2',
            'locked_by' => null,
        ]);

        $response = $this->actingAs($student)->postJson(route('student.phaser-results.store'), [
            'submission_uuid' => '7818d965-584e-4d22-89d2-00ea2969bdb1',
            'entry_type' => 'assessment',
            'lesson_key' => 'q1-m1-l2',
            'game_key' => 'ft-q1-mixtures-l2',
            'payload' => [
                'answers' => [
                    'l2-1' => 'Uniform Mixture',
                    'l2-2' => 'Non-uniform Mixture',
                    'l2-3' => 'Beverage',
                    'l2-4' => 'Cereal pieces are visible',
                    'l2-5' => 'Construction',
                ],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['lesson_key']);

        $this->assertDatabaseCount('phaser_game_results', 0);
    }

    public function test_locked_parent_major_rejects_a_new_phaser_submission(): void
    {
        [$student, $section] = $this->buildStudent();

        SectionPhaserMajorLock::query()->create([
            'section_id' => $section->id,
            'major_key' => 'q1-major-1',
            'locked_by' => null,
        ]);

        $response = $this->actingAs($student)->postJson(route('student.phaser-results.store'), [
            'submission_uuid' => '6529e0d2-2709-44ac-9fdd-3250a8f31fd6',
            'entry_type' => 'assessment',
            'lesson_key' => 'q1-m1-l1',
            'game_key' => 'ft-q1-mixtures-l1',
            'payload' => [
                'answers' => [
                    'l1-1' => 'Uniform Mixture',
                    'l1-2' => 'Uniform Mixture',
                    'l1-3' => 'Its parts are visible',
                    'l1-4' => 'Components can be seen separately',
                    'l1-5' => 'Uniform - Salt Water - Same throughout',
                ],
            ],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['lesson_key']);

        $this->assertDatabaseCount('phaser_game_results', 0);
    }

    /**
     * @return array{0: User, 1: Section}
     */
    private function buildStudent(): array
    {
        $student = User::factory()->student()->create();
        $section = Section::factory()->create();

        StudentProfile::factory()->create([
            'user_id' => $student->id,
            'section_id' => $section->id,
        ]);

        return [$student, $section];
    }
}
