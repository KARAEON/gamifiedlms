<?php

namespace Tests\Feature;

use App\Enums\ActivityPhase;
use App\Enums\ActivityType;
use App\Models\Activity;
use App\Models\AdminReportSubmission;
use App\Models\AuditLog;
use App\Models\GradingPolicy;
use App\Models\Lesson;
use App\Models\ScoreRecord;
use App\Models\Section;
use App\Models\StudentProfile;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminEnterpriseTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_dashboard_and_teacher_cannot(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->teacher()->create();

        $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk();
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'admin.dashboard.viewed',
            'entity_type' => 'analytics_dashboard',
        ]);

        $this->actingAs($teacher)->get(route('admin.dashboard'))->assertForbidden();
    }

    public function test_admin_can_manage_grading_policies_with_weight_validation(): void
    {
        $admin = User::factory()->admin()->create();
        $section = Section::factory()->create();

        $this->actingAs($admin)
            ->post(route('admin.policies.store'), [
                'name' => 'Invalid Weight Policy',
                'scope' => 'section',
                'section_id' => $section->id,
                'mastery_threshold' => 75,
                'attainment_threshold' => 80,
                'gamified_weight' => 30,
                'formative_weight' => 30,
                'summative_weight' => 30,
            ])
            ->assertStatus(422);

        $this->actingAs($admin)
            ->post(route('admin.policies.store'), [
                'name' => 'Grade 6 Science Policy',
                'scope' => 'section',
                'section_id' => $section->id,
                'subject' => 'Science',
                'mastery_threshold' => 78,
                'attainment_threshold' => 82,
                'gamified_weight' => 20,
                'formative_weight' => 40,
                'summative_weight' => 40,
                'weekly_summative_required' => 1,
                'is_active' => 1,
            ])
            ->assertRedirect();

        $policy = GradingPolicy::query()->where('name', 'Grade 6 Science Policy')->firstOrFail();
        $this->assertSame(78.0, (float) $policy->mastery_threshold);

        $this->actingAs($admin)
            ->patch(route('admin.policies.update', $policy), [
                'name' => 'Grade 6 Science Policy Updated',
                'scope' => 'section',
                'section_id' => $section->id,
                'subject' => 'Science',
                'mastery_threshold' => 80,
                'attainment_threshold' => 85,
                'gamified_weight' => 25,
                'formative_weight' => 35,
                'summative_weight' => 40,
                'is_active' => 1,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'admin.policy.created',
            'entity_type' => 'grading_policy',
            'entity_id' => $policy->id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'admin.policy.updated',
            'entity_type' => 'grading_policy',
            'entity_id' => $policy->id,
        ]);
    }

    public function test_admin_can_generate_reports_and_log_submission(): void
    {
        $admin = User::factory()->admin()->create();
        $teacher = User::factory()->teacher()->create();
        $section = Section::factory()->create();
        $section->teachers()->attach($teacher->id);

        $student = User::factory()->student()->create();
        StudentProfile::factory()->create([
            'user_id' => $student->id,
            'section_id' => $section->id,
        ]);

        $lesson = Lesson::factory()->for($teacher, 'creator')->create(['subject' => 'Science']);
        $topic = Topic::factory()->for($lesson)->create();
        $summative = Activity::factory()->create([
            'topic_id' => $topic->id,
            'instructional_phase' => ActivityPhase::SUMMATIVE,
            'activity_type' => ActivityType::MULTIPLE_CHOICE,
        ]);

        ScoreRecord::query()->create([
            'student_id' => $student->id,
            'section_id' => $section->id,
            'lesson_id' => $lesson->id,
            'topic_id' => $topic->id,
            'activity_id' => $summative->id,
            'score' => 84,
            'max_score' => 100,
            'accuracy' => 84,
            'completion_status' => 'completed',
            'attempted_at' => now()->subHours(4),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.reports.download'), [
                'report_scope' => 'class',
                'format' => 'view',
            ])
            ->assertOk()
            ->assertSee('Report Preview');

        $csvResponse = $this->actingAs($admin)
            ->post(route('admin.reports.download'), [
                'report_scope' => 'class',
                'format' => 'csv',
            ]);
        $csvResponse->assertOk();
        $this->assertStringContainsString('text/csv', (string) $csvResponse->headers->get('content-type'));

        $this->actingAs($admin)
            ->post(route('admin.reports.submit'), [
                'report_scope' => 'quarterly',
                'scope_reference' => 'Quarter 1',
                'destination' => 'Division Office',
            ])
            ->assertRedirect();

        $this->assertSame(1, AdminReportSubmission::query()->count());
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'admin.report.downloaded',
            'entity_type' => 'admin_report',
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'admin.report.submitted',
            'entity_type' => 'admin_report_submission',
        ]);
        $this->assertGreaterThan(0, AuditLog::query()->count());
    }
}
