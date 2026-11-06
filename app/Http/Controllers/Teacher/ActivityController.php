<?php

namespace App\Http\Controllers\Teacher;

use App\Enums\ActivityPhase;
use App\Enums\ActivityType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\StoreActivityRequest;
use App\Models\Activity;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Models\Topic;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ActivityController extends Controller
{
    public function index(Request $request): View
    {
        $query = Activity::query()
            ->with(['topic.lesson'])
            ->withCount('questions')
            ->orderByDesc('created_at');

        if ($request->filled('activity_type')) {
            $query->where('activity_type', (string) $request->query('activity_type'));
        }

        if ($request->filled('instructional_phase')) {
            $query->where('instructional_phase', (string) $request->query('instructional_phase'));
        }

        if ($request->filled('topic_id')) {
            $query->where('topic_id', (int) $request->query('topic_id'));
        }

        $activities = $query->paginate(12)->withQueryString();
        $banks = QuestionBank::query()->whereIn('topic_id', $activities->getCollection()->pluck('topic_id')->unique())
        ->withCount('questions')->with('questions.choices')->get()->keyBy(fn ($bank) => $bank->topic_id.'-'.$bank->phase);

        return view('teacher.activities.index', [
            'activities' => $activities,
            'banks' => $banks,
            'topics' => Topic::query()->with('lesson')->orderBy('title')->get(),
            'types' => ActivityType::labels(),
            'phases' => ActivityPhase::labels(),
        ]);
    }

    public function store(StoreActivityRequest $request, AuditLogService $auditLogService): RedirectResponse
    {
        $payload = $request->validated();
        $payload['is_active'] = $request->boolean('is_active');
        $payload['allow_retry'] = $request->boolean('allow_retry');

        if ($payload['is_active'] && in_array($payload['instructional_phase'], [ActivityPhase::FORMATIVE->value, ActivityPhase::SUMMATIVE->value], true)) {
            $bank = QuestionBank::query()->where('topic_id', $payload['topic_id'])->where('phase', $payload['instructional_phase'])->first();
            $count = $bank?->questions()->count() ?? 0;
            if ($count < 50 || $count > 100) {
                throw ValidationException::withMessages(['is_active' => 'An FT/ST assessment can only be activated when its bank has 50 to 100 questions.']);
            }
        }

        $activity = Activity::query()->create($payload);
        $auditLogService->log(
            $request->user(),
            'teacher.activity.created',
            'activity',
            $activity->id,
            [
                'topic_id' => $activity->topic_id,
                'instructional_phase' => $activity->instructional_phase?->value,
            ],
            $request
        );

        return redirect()->route('teacher.activities.index')->with('status', 'Activity created successfully.');
    }

    public function update(StoreActivityRequest $request, Activity $activity, AuditLogService $auditLogService): RedirectResponse
    {
        $payload = $request->validated();
        $payload['is_active'] = $request->boolean('is_active');
        $payload['allow_retry'] = $request->boolean('allow_retry');

        if ($payload['is_active'] && in_array($payload['instructional_phase'], [ActivityPhase::FORMATIVE->value, ActivityPhase::SUMMATIVE->value], true)) {
            $bank = QuestionBank::query()->where('topic_id', $payload['topic_id'])->where('phase', $payload['instructional_phase'])->first();
            $count = $bank?->questions()->count() ?? 0;
            if ($count < 50 || $count > 100) {
                throw ValidationException::withMessages(['is_active' => 'An FT/ST assessment can only be activated when its bank has 50 to 100 questions.']);
            }
        }

        $activity->update($payload);
        $auditLogService->log(
            $request->user(),
            'teacher.activity.updated',
            'activity',
            $activity->id,
            [
                'topic_id' => $activity->topic_id,
                'instructional_phase' => $activity->instructional_phase?->value,
            ],
            $request
        );

        return redirect()->route('teacher.activities.index')->with('status', 'Activity updated successfully.');
    }

    public function addQuestion(Request $request, Activity $activity, AuditLogService $auditLogService): RedirectResponse
    {
        abort_unless(in_array($activity->instructional_phase?->value, [ActivityPhase::FORMATIVE->value, ActivityPhase::SUMMATIVE->value], true), 404);
        $bank = QuestionBank::query()->firstOrCreate(['topic_id' => $activity->topic_id, 'phase' => $activity->instructional_phase->value]);
        $question = $this->saveBankQuestion($request, $bank);
        $auditLogService->log(
            $request->user(),
            'teacher.activity.question_added',
            'question',
            $question->id,
            [
                'question_bank_id' => $bank->id,
            ],
            $request
        );

        return redirect()->route('teacher.activities.index')->with('status', 'Question added to the '.strtoupper(substr($bank->phase, 0, 2)).' question bank.');
    }

    public function updateQuestion(Request $request, Question $question): RedirectResponse
    {
        abort_unless($question->question_bank_id && $question->questionBank()->exists(), 404);
        $this->saveBankQuestion($request, $question->questionBank, $question);
        return back()->with('status', 'Question updated.');
    }

    public function deleteQuestion(Question $question): RedirectResponse
    {
        abort_unless($question->question_bank_id && $question->questionBank()->exists(), 404);
        if ($question->attemptAnswers()->exists()) {
            throw ValidationException::withMessages(['question' => 'This question is used by a saved student attempt and cannot be deleted.']);
        }
        $question->delete();
        $this->deactivateInvalidBankActivities($question->questionBank);
        return back()->with('status', 'Question deleted.');
    }

    public function updateBank(Request $request, Activity $activity): RedirectResponse
    {
        abort_unless(in_array($activity->instructional_phase?->value, [ActivityPhase::FORMATIVE->value, ActivityPhase::SUMMATIVE->value], true), 404);
        $validated = $request->validate(['questions_per_attempt' => ['required', 'integer', 'min:1', 'max:100']]);
        $bank = QuestionBank::query()->firstOrCreate(['topic_id' => $activity->topic_id, 'phase' => $activity->instructional_phase->value]);
        $bank->update($validated);
        return back()->with('status', 'Assessment question count saved.');
    }

    private function saveBankQuestion(Request $request, QuestionBank $bank, ?Question $question = null): Question
    {
        $validated = $request->validate([
            'prompt' => ['required', 'string', 'max:5000'],
            'question_type' => ['required', 'in:multiple_choice,matching,guess_word,pics_word,visual_challenge'],
            'correct_answer' => ['nullable', 'string', 'max:5000'],
            'points' => ['required', 'integer', 'min:1', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'media_path' => ['nullable', 'string', 'max:2048'],
            'payload_json' => ['nullable', 'string', 'max:20000'],
            'choices' => ['nullable', 'array', 'max:10'],
            'choices.*.label' => ['nullable', 'string', 'max:1000'],
            'choices.*.value' => ['nullable', 'string', 'max:255'],
            'choices.*.is_correct' => ['nullable', 'boolean'],
        ]);
        $payload = null;
        if (trim((string) ($validated['payload_json'] ?? '')) !== '') {
            $payload = json_decode($validated['payload_json'], true);
            if (! is_array($payload) || json_last_error() !== JSON_ERROR_NONE) {
                throw ValidationException::withMessages(['payload_json' => 'Payload must be valid JSON.']);
            }
        }
        $choices = collect($validated['choices'] ?? [])->filter(fn ($choice) => trim((string) ($choice['label'] ?? '')) !== '')->values();
        $choices = $choices->map(fn ($choice, $index) => array_merge($choice, ['value' => trim((string) ($choice['value'] ?? '')) !== '' ? $choice['value'] : (string) ($index + 1)]));
        if (in_array($validated['question_type'], ['multiple_choice', 'visual_challenge'], true) && ($choices->count() < 2 || $choices->where('is_correct', true)->count() !== 1)) {
            throw ValidationException::withMessages(['choices' => 'Add at least two choices and mark exactly one as correct.']);
        }
        if (in_array($validated['question_type'], ['multiple_choice', 'visual_challenge'], true)) {
            $validated['correct_answer'] = (string) $choices->firstWhere('is_correct', true)['value'];
        }
        if (! $question && $bank->questions()->count() >= 100) {
            throw ValidationException::withMessages(['prompt' => 'A question bank can contain no more than 100 questions.']);
        }

        $saved = DB::transaction(function () use ($bank, $question, $validated, $payload, $choices): Question {
            $question ??= new Question(['question_bank_id' => $bank->id]);
            $question->fill([
                'question_bank_id' => $bank->id,
                'prompt' => $validated['prompt'],
                'question_type' => $validated['question_type'],
                'correct_answer' => $validated['correct_answer'] ?? null,
                'points' => $validated['points'],
                'sort_order' => $validated['sort_order'] ?? ($bank->questions()->max('sort_order') ?? 0) + 1,
                'media_path' => $validated['media_path'] ?? null,
                'payload' => $payload,
            ])->save();

            $question->choices()->delete();
            foreach ($choices as $index => $choice) {
                $question->choices()->create([
                    'label' => $choice['label'],
                    'value' => ($choice['value'] ?? '') !== '' ? $choice['value'] : (string) ($index + 1),
                    'is_correct' => (bool) ($choice['is_correct'] ?? false),
                    'sort_order' => $index + 1,
                ]);
            }
            return $question;
        });
        $this->deactivateInvalidBankActivities($bank);
        return $saved;
    }

    private function deactivateInvalidBankActivities(QuestionBank $bank): void
    {
        $count = $bank->questions()->count();
        if ($count < 50 || $count > 100) {
            Activity::query()->where('topic_id', $bank->topic_id)->where('instructional_phase', $bank->phase)->where('is_active', true)->update(['is_active' => false]);
        }
    }
}
