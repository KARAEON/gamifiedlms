<?php

namespace Tests\Feature;

use App\Models\PhaserGameResult;
use App\Models\Section;
use App\Models\User;
use App\Services\AiInsightService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class AiDecisionSupportTest extends TestCase
{
    use RefreshDatabase;

    private function teacherWithScore(): User
    {
        $teacher = User::factory()->teacher()->create();
        $section = Section::factory()->create();
        $section->teachers()->attach($teacher);
        $student = User::factory()->student()->create(['name' => 'Private Student']);
        PhaserGameResult::query()->create([
            'student_id' => $student->id, 'section_id' => $section->id,
            'lesson_key' => 'q1-m1-l1', 'lesson_title' => 'Mixtures 1',
            'game_key' => 'ft-q1-mixtures-l1', 'entry_type' => 'assessment',
            'phase' => 'formative', 'game_title' => 'Formative test', 'topic_title' => 'Mixtures',
            'submission_uuid' => (string) Str::uuid(), 'attempt_number' => 1,
            'score' => 2, 'max_score' => 5, 'accuracy' => 40,
            'result_status' => 'fail', 'payload' => [], 'completed_at' => now(),
        ]);
        return $teacher;
    }

    private function analysis(): array
    {
        return ['class_analysis' => 'Use guided practice.', 'at_risk_group_strategy' => 'Reteach mixtures.',
            'critical_student_focus' => 'Support Priority learner with worked examples.'];
    }

    public function test_ollama_failure_uses_groq_and_includes_game_ft_scores(): void
    {
        config(['services.groq.key' => 'test-key', 'services.ollama.enabled' => true]);
        Http::fake([
            '*11434*' => Http::response([], 503),
            'api.groq.com/*' => Http::response(['choices' => [['message' => ['content' => json_encode($this->analysis())]]]]),
        ]);
        $teacher = $this->teacherWithScore();
        $result = app(AiInsightService::class)->generateForTeacher($teacher);
        $this->assertSame('groq', $result['source']);
        $this->assertCount(1, $result['roster']);
        $this->assertSame(40.0, $result['roster'][0]['average_accuracy']);
        $this->assertStringContainsString('Private Student', $result['analysis']['critical_student_focus']);
        Http::assertSent(fn ($request) => str_contains($request->url(), 'groq.com')
            && ! str_contains($request->body(), 'Private Student')
            && $request->hasHeader('Authorization', 'Bearer test-key'));
    }

    public function test_invalid_hosted_response_still_returns_score_based_recommendations(): void
    {
        config(['services.groq.key' => 'test-key', 'services.ollama.enabled' => false]);
        Http::fake(['*' => Http::response(['choices' => [['message' => ['content' => '{}']]]])]);
        $teacher = $this->teacherWithScore();
        $this->actingAs($teacher)->getJson(route('teacher.insights.ai.generate'))
            ->assertOk()->assertJsonPath('source', 'fallback')
            ->assertJsonPath('roster.0.average_accuracy', 40)
            ->assertJsonStructure(['data' => ['class_analysis', 'at_risk_group_strategy', 'critical_student_focus']]);
        Http::assertSentCount(1);
    }

    public function test_teacher_without_assigned_sections_receives_no_other_students_data(): void
    {
        Http::fake();
        $this->teacherWithScore();
        $result = app(AiInsightService::class)->generateForTeacher(User::factory()->teacher()->create());
        $this->assertSame([], $result['roster']);
        Http::assertNothingSent();
    }

    public function test_successful_ollama_does_not_call_hosted_provider(): void
    {
        config(['services.groq.key' => 'test-key', 'services.ollama.enabled' => true]);
        Http::fake(['*' => Http::response(['response' => json_encode($this->analysis())])]);
        $result = app(AiInsightService::class)->generateForTeacher($this->teacherWithScore());
        $this->assertSame('ollama', $result['source']);
        Http::assertSentCount(1);
    }
}
