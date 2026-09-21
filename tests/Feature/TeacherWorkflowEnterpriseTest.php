<?php

namespace Tests\Feature;

use App\Enums\ActivityPhase;
use App\Enums\ActivityType;
use App\Models\Activity;
use App\Models\AuditLog;
use App\Models\InterventionAssignment;
use App\Models\Lesson;
use App\Models\MasteryCycle;
use App\Models\ScoreRecord;
use App\Models\Section;
use App\Models\StudentProfile;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherWorkflowEnterpriseTest extends TestCase
{
    use RefreshDatabase;

    public function test_progression_gate_proceeds_at_eighty_percent_attainment(): void
    {
        [$teacher, $section, $topic, $gamified, $formative, $students] = $this->buildClassContext();

        $scores = [95, 83, 78, 76, 61];
        foreach ($students as $index => $student) {
            ScoreRecord::query()->create([
                'student_id' => $student->id,
                'section_id' => $section->id,
                'lesson_id' => $topic->lesson_id,
                'topic_id' => $topic->id,
                'activity_id' => $gamified->id,
                'score' => $scores[$index],
                'max_score' => 100,
                'accuracy' => $scores[$index],
                'completion_status' => 'completed',
                'attempted_at' => now()->subDay(),
            ]);

            ScoreRecord::query()->create([
                'student_id' => $student->id,
                'section_id' => $section->id,
                'lesson_id' => $topic->lesson_id,
                'topic_id' => $topic->id,
                'activity_id' => $formative->id,
                'score' => $scores[$index],
                'max_score' => 100,
                'accuracy' => $scores[$index],
                'completion_status' => 'completed',
                'attempted_at' => now()->subHours(8),
            ]);
        }

        $this->actingAs($teacher)
            ->post(route('teacher.workflow.evaluate'), [
                'section_id' => $section->id,
                'topic_id' => $topic->id,
            ])
            ->assertRedirect();

        $cycle = MasteryCycle::query()->latest('id')->first();
        $this->assertNotNull($cycle);
        $this->assertSame('proceed', $cycle->decision);
        $this->assertSame(80.0, (float) $cycle->class_attainment);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'teacher.workflow.evaluated',
            'entity_type' => 'mastery_cycle',
            'entity_id' => $cycle->id,
        ]);

        $this->assertGreaterThan(0, InterventionAssignment::query()->count());
    }

    public function test_reteach_logging_and_intervention_update_are_audited(): void
    {
        [$teacher, $section, $topic, $gamified, $formative, $students] = $this->buildClassContext();

        $scores = [62, 68, 74, 59, 70];
        foreach ($students as $index => $student) {
            ScoreRecord::query()->create([
                'student_id' => $student->id,
                'section_id' => $section->id,
                'lesson_id' => $topic->lesson_id,
                'topic_id' => $topic->id,
                'activity_id' => $gamified->id,
                'score' => $scores[$index],
                'max_score' => 100,
                'accuracy' => $scores[$index],
                'completion_status' => 'completed',
                'attempted_at' => now()->subDay(),
            ]);
            ScoreRecord::query()->create([
                'student_id' => $student->id,
                'section_id' => $section->id,
                'lesson_id' => $topic->lesson_id,
                'topic_id' => $topic->id,
                'activity_id' => $formative->id,
                'score' => $scores[$index],
                'max_score' => 100,
                'accuracy' => $scores[$index],
                'completion_status' => 'completed',
                'attempted_at' => now()->subHours(4),
            ]);
        }

        $this->actingAs($teacher)->post(route('teacher.workflow.evaluate'), [
            'section_id' => $section->id,
            'topic_id' => $topic->id,
        ])->assertRedirect();

        $cycle = MasteryCycle::query()->latest('id')->firstOrFail();
        $this->assertSame('reteach', $cycle->decision);
        $this->assertTrue((bool) $cycle->requires_reteach);

        $this->actingAs($teacher)->post(route('teacher.workflow.reteach', $cycle), [
            'reteach_strategy' => 'Chunked guided instruction',
            'reteach_notes' => 'Used alternative examples and peer modeling.',
        ])->assertRedirect();

        $cycle->refresh();
        $this->assertFalse((bool) $cycle->requires_reteach);
        $this->assertSame(1, (int) $cycle->reteach_attempts);

        $intervention = InterventionAssignment::query()->latest('id')->firstOrFail();
        $this->actingAs($teacher)->patch(route('teacher.workflow.interventions.update', $intervention), [
            'status' => 'completed',
            'notes' => 'Learner completed remediation packet.',
        ])->assertRedirect();

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'teacher.workflow.reteach_logged',
            'entity_type' => 'mastery_cycle',
            'entity_id' => $cycle->id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'teacher.intervention.updated',
            'entity_type' => 'intervention_assignment',
            'entity_id' => $intervention->id,
        ]);
        $this->assertGreaterThanOrEqual(3, AuditLog::query()->count());
    }

    /**
     * @return array{0: User, 1: Section, 2: Topic, 3: Activity, 4: Activity, 5: \Illuminate\Support\Collection<int, User>}
     */
    protected function buildClassContext(): array
    {
        $teacher = User::factory()->teacher()->create();
        $section = Section::factory()->create();
        $section->teachers()->attach($teacher->id);

        $lesson = Lesson::factory()->for($teacher, 'creator')->create([
            'subject' => 'Science',
        ]);
        $topic = Topic::factory()->for($lesson)->create();

        $gamified = Activity::factory()->create([
            'topic_id' => $topic->id,
            'instructional_phase' => ActivityPhase::GAMIFIED,
            'activity_type' => ActivityType::MATCHING,
            'max_score' => 100,
        ]);
        $formative = Activity::factory()->create([
            'topic_id' => $topic->id,
            'instructional_phase' => ActivityPhase::FORMATIVE,
            'activity_type' => ActivityType::MULTIPLE_CHOICE,
            'max_score' => 100,
        ]);

        $students = User::factory()->count(5)->student()->create();
        foreach ($students as $student) {
            StudentProfile::factory()->create([
                'user_id' => $student->id,
                'section_id' => $section->id,
            ]);
        }

        return [$teacher, $section, $topic, $gamified, $formative, $students];
    }
}
