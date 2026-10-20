<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\Section;
use App\Models\StudentProfile;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StaffWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_pages_render_in_the_staff_workspace_with_existing_destinations(): void
    {
        $teacher = User::factory()->teacher()->create();
        $section = Section::factory()->create();
        $section->teachers()->attach($teacher);
        $student = User::factory()->student()->create();
        StudentProfile::factory()->create(['user_id' => $student->id, 'section_id' => $section->id]);
        $lesson = Lesson::factory()->create(['created_by' => $teacher->id]);
        $topic = Topic::factory()->create(['lesson_id' => $lesson->id]);

        $this->actingAs($teacher);
        foreach (['dashboard', 'students.index', 'sections.index', 'lessons.index', 'activities.index', 'scores.index', 'grading.index', 'workflow.index', 'analytics.index', 'insights.index', 'reports.index', 'profile.edit'] as $route) {
            $this->get(route('teacher.'.$route))->assertOk()->assertSee('staff-shell')->assertSee('Skip to content');
        }
        $this->get(route('teacher.students.show', $student))->assertOk()->assertSee('edit-students');
        $this->get(route('teacher.sections.show', $section))->assertOk()->assertSee('edit-sections');
        $this->get(route('teacher.workflow.index', ['section_id' => $section->id, 'topic_id' => $topic->id]))->assertOk()->assertSee('Instructional cycle');
    }

    public function test_school_head_pages_share_the_staff_shell_and_teacher_routes_stay_restricted(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin);
        foreach (['dashboard', 'reports.index', 'policies.index', 'audit.index'] as $route) {
            $this->get(route('admin.'.$route))->assertOk()->assertSee('School Head workspace')->assertSee('staff-shell');
        }
        $this->get(route('teacher.students.index'))->assertForbidden();
    }

    public function test_invalid_section_policy_preserves_input_for_the_dialog(): void
    {
        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->from(route('admin.policies.index'))->post(route('admin.policies.store'), [
            'name' => 'Class policy', 'scope' => 'section', 'mastery_threshold' => 75,
            'attainment_threshold' => 80, 'gamified_weight' => 20, 'formative_weight' => 40,
            'summative_weight' => 40, '_workspace_form' => 'policy-editor',
        ])->assertRedirect(route('admin.policies.index'))->assertSessionHasErrors('section_id')
            ->assertSessionHasInput('name', 'Class policy')->assertSessionHasInput('_workspace_form', 'policy-editor');
    }

    public function test_student_dashboard_keeps_its_existing_layout(): void
    {
        $student = User::factory()->student()->create();
        StudentProfile::factory()->create(['user_id' => $student->id]);
        $this->actingAs($student)->get(route('student.dashboard'))->assertOk()
            ->assertSee('game-container')->assertDontSee('staff-shell');
        $this->get(route('student.scores.index'))->assertOk()->assertSee('Student Workspace')->assertDontSee('staff-shell');
    }
}
