<?php

namespace Tests\Feature;

use App\Models\Section;
use App\Models\SectionPhaserMajorLock;
use App\Models\SectionPhaserLessonLock;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherSectionPhaserLockTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_update_section_phaser_locks(): void
    {
        $teacher = User::factory()->teacher()->create();
        $section = Section::factory()->create();
        $section->teachers()->attach($teacher->id);

        $response = $this->actingAs($teacher)->patch(route('teacher.sections.phaser-locks.update', $section), [
            'locked_majors' => ['q1-major-1', 'q3-major-2'],
            'locked_lessons' => ['q1-m1-l1', 'q2-m2-l4'],
        ]);

        $response->assertRedirect(route('teacher.sections.show', $section));

        $this->assertDatabaseHas('section_phaser_major_locks', [
            'section_id' => $section->id,
            'major_key' => 'q1-major-1',
            'locked_by' => $teacher->id,
        ]);
        $this->assertDatabaseHas('section_phaser_major_locks', [
            'section_id' => $section->id,
            'major_key' => 'q3-major-2',
            'locked_by' => $teacher->id,
        ]);
        $this->assertDatabaseMissing('section_phaser_major_locks', [
            'section_id' => $section->id,
            'major_key' => 'q2-major-1',
        ]);
        $this->assertDatabaseHas('section_phaser_lesson_locks', [
            'section_id' => $section->id,
            'lesson_key' => 'q1-m1-l1',
            'locked_by' => $teacher->id,
        ]);
        $this->assertDatabaseHas('section_phaser_lesson_locks', [
            'section_id' => $section->id,
            'lesson_key' => 'q2-m2-l4',
            'locked_by' => $teacher->id,
        ]);
        $this->assertDatabaseMissing('section_phaser_lesson_locks', [
            'section_id' => $section->id,
            'lesson_key' => 'q1-m1-l2',
        ]);
    }

    public function test_student_dashboard_payload_reflects_explicit_and_inherited_section_locks(): void
    {
        $student = User::factory()->student()->create();
        $section = Section::factory()->create();

        StudentProfile::factory()->create([
            'user_id' => $student->id,
            'section_id' => $section->id,
        ]);

        SectionPhaserMajorLock::query()->create([
            'section_id' => $section->id,
            'major_key' => 'q1-major-1',
            'locked_by' => null,
        ]);

        SectionPhaserLessonLock::query()->create([
            'section_id' => $section->id,
            'lesson_key' => 'q2-m2-l4',
            'locked_by' => null,
        ]);

        $this->actingAs($student)
            ->get(route('student.dashboard'))
            ->assertOk()
            ->assertSee('"majorAccess"', false)
            ->assertSee('"lessonAccess"', false)
            ->assertSee('"q1-major-1":{"locked":true', false)
            ->assertSee('"q1-m1-l2":{"locked":true', false)
            ->assertSee('"lockReason":"major"', false)
            ->assertSee('"q2-m2-l4":{"locked":true', false)
            ->assertSee('"q4-m3-l5":{"locked":false', false);
    }

    public function test_unlocking_a_major_keeps_explicit_lesson_locks_that_remain_selected(): void
    {
        $teacher = User::factory()->teacher()->create();
        $section = Section::factory()->create();
        $section->teachers()->attach($teacher->id);

        $this->actingAs($teacher)->patch(route('teacher.sections.phaser-locks.update', $section), [
            'locked_majors' => ['q1-major-1'],
            'locked_lessons' => ['q1-m1-l3'],
        ]);

        $this->actingAs($teacher)->patch(route('teacher.sections.phaser-locks.update', $section), [
            'locked_majors' => [],
            'locked_lessons' => ['q1-m1-l3'],
        ])->assertRedirect(route('teacher.sections.show', $section));

        $this->assertDatabaseMissing('section_phaser_major_locks', [
            'section_id' => $section->id,
            'major_key' => 'q1-major-1',
        ]);
        $this->assertDatabaseHas('section_phaser_lesson_locks', [
            'section_id' => $section->id,
            'lesson_key' => 'q1-m1-l3',
        ]);
    }
}
