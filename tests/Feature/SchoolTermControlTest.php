<?php

namespace Tests\Feature;

use App\Models\SchoolSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SchoolTermControlTest extends TestCase
{
    use RefreshDatabase;

    public function test_quarter_setting_starts_at_q1_and_admin_can_change_it_to_q3_or_q4(): void
    {
        $admin = User::factory()->admin()->create();

        $this->assertSame(1, SchoolSetting::currentQuarter());
        $this->actingAs($admin)->get(route('admin.school-term.index'))
            ->assertOk()
            ->assertSee('Quarter 1')
            ->assertSee('Third quarter (Q3)')
            ->assertSee('Fourth quarter (Q4)');

        foreach ([3, 4] as $quarter) {
            $this->actingAs($admin)->patch(route('admin.school-term.update'), ['current_quarter' => $quarter])
                ->assertRedirect(route('admin.school-term.index'));
            $this->assertSame($quarter, SchoolSetting::currentQuarter());
        }
        $this->assertDatabaseHas('audit_logs', ['action' => 'admin.school_term.updated']);
    }

    public function test_only_q3_or_q4_can_be_selected_and_teachers_cannot_change_school_term(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->teacher()->create();

        $this->actingAs($admin)->patch(route('admin.school-term.update'), ['current_quarter' => 2])
            ->assertSessionHasErrors('current_quarter');
        $this->assertSame(1, SchoolSetting::currentQuarter());

        $this->actingAs($teacher)->get(route('admin.school-term.index'))->assertForbidden();
        $this->actingAs($teacher)->patch(route('admin.school-term.update'), ['current_quarter' => 3])->assertForbidden();
    }

    public function test_teacher_default_uses_current_quarter_but_explicit_quarter_takes_precedence(): void
    {
        $teacher = User::factory()->teacher()->create();
        SchoolSetting::query()->whereKey(1)->update(['current_quarter' => 4]);

        $this->actingAs($teacher)->get(route('teacher.grading.index'))
            ->assertOk()
            ->assertSee('<option value="4" selected', false);
        $this->actingAs($teacher)->get(route('teacher.grading.index', ['quarter' => 2]))
            ->assertOk()
            ->assertSee('<option value="2" selected', false);
    }

    public function test_student_grading_highlights_current_quarter_and_keeps_all_quarters_visible(): void
    {
        $student = User::factory()->student()->create();
        SchoolSetting::query()->whereKey(1)->update(['current_quarter' => 3]);

        $response = $this->actingAs($student)->get(route('student.grading.index'))
            ->assertOk()
            ->assertSee('Current school quarter: Q3')
            ->assertSee('data-current-quarter="true"', false);

        foreach ([1, 2, 3, 4] as $quarter) {
            $response->assertSee('data-quarter="'.$quarter.'"', false);
        }
    }
}
