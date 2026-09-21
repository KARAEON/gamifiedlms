<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Report;
use App\Models\ReportDelivery;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherSchoolHeadSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_submit_report_to_school_head(): void
    {
        $teacher = User::factory()->teacher()->create();
        $report = Report::factory()->create([
            'generated_by' => $teacher->id,
        ]);

        $this->actingAs($teacher)
            ->post(route('teacher.reports.submit_school_head', $report), [
                'teacher_note' => 'Please review before Friday.',
            ])
            ->assertRedirect(route('teacher.reports.index'));

        $delivery = ReportDelivery::query()->first();
        $this->assertNotNull($delivery);
        $this->assertSame($report->id, $delivery->report_id);
        $this->assertSame('submitted', $delivery->status);
        $this->assertSame('Please review before Friday.', $delivery->teacher_note);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'teacher.report.submitted_to_school_head',
            'entity_type' => 'report_delivery',
            'entity_id' => $delivery->id,
        ]);
    }

    public function test_teacher_cannot_submit_same_report_twice_while_pending(): void
    {
        $teacher = User::factory()->teacher()->create();
        $report = Report::factory()->create([
            'generated_by' => $teacher->id,
        ]);

        $this->actingAs($teacher)->post(route('teacher.reports.submit_school_head', $report))->assertRedirect();
        $this->actingAs($teacher)->post(route('teacher.reports.submit_school_head', $report))->assertRedirect();

        $this->assertSame(1, ReportDelivery::query()->count());
    }

    public function test_admin_can_acknowledge_teacher_submission(): void
    {
        $teacher = User::factory()->teacher()->create();
        $admin = User::factory()->admin()->create();
        $report = Report::factory()->create([
            'generated_by' => $teacher->id,
        ]);

        $delivery = ReportDelivery::factory()->create([
            'report_id' => $report->id,
            'submitted_by' => $teacher->id,
            'status' => 'submitted',
            'submitted_at' => now()->subHour(),
        ]);

        $this->actingAs($admin)
            ->patch(route('admin.reports.teacher_submissions.acknowledge', $delivery), [
                'admin_note' => 'Reviewed and accepted.',
            ])
            ->assertRedirect(route('admin.reports.index'));

        $delivery->refresh();
        $this->assertSame('acknowledged', $delivery->status);
        $this->assertSame($admin->id, $delivery->acknowledged_by);
        $this->assertSame('Reviewed and accepted.', $delivery->admin_note);
        $this->assertNotNull($delivery->acknowledged_at);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'admin.teacher_report.acknowledged',
            'entity_type' => 'report_delivery',
            'entity_id' => $delivery->id,
        ]);
        $this->assertGreaterThan(0, AuditLog::query()->count());
    }

    public function test_teacher_cannot_submit_another_teachers_report(): void
    {
        $owner = User::factory()->teacher()->create();
        $otherTeacher = User::factory()->teacher()->create();
        $report = Report::factory()->create([
            'generated_by' => $owner->id,
        ]);

        $this->actingAs($otherTeacher)
            ->post(route('teacher.reports.submit_school_head', $report))
            ->assertForbidden();
    }
}
