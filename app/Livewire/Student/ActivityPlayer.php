<?php

namespace App\Livewire\Student;

use App\Models\Activity;
use App\Models\Question;
use App\Models\QuestionBank;
use App\Services\ActivityScoringService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Validation\ValidationException;
use Livewire\Attributes\Locked;
use Livewire\Component;

class ActivityPlayer extends Component
{
    use AuthorizesRequests;

    #[Locked]
    public Activity $activity;

    /**
     * @var array<int, mixed>
     */
    public array $responses = [];

    /**
     * @var array<string, mixed>|null
     */
    public ?array $result = null;

    public int $startedAt = 0;

    #[Locked]
    public array $selectedQuestionIds = [];

    public function mount(Activity $activity): void
    {
        $this->authorize('view', $activity);

        $this->activity = $activity->load('topic.lesson');
        if (in_array($activity->instructional_phase?->value, ['formative', 'summative'], true)) {
            $bank = QuestionBank::query()->where('topic_id', $activity->topic_id)->where('phase', $activity->instructional_phase->value)->withCount('questions')->first();
            if ($bank && $bank->questions_count > 0) {
                $count = min((int) $bank->questions_per_attempt, $bank->questions_count);
                $this->selectedQuestionIds = $bank->questions()->inRandomOrder()->limit($count)->pluck('id')->map(fn ($id) => (int) $id)->all();
            }
        }
        if ($this->selectedQuestionIds === []) {
            $this->selectedQuestionIds = $activity->questions()->pluck('id')->map(fn ($id) => (int) $id)->all();
        }
        $this->startedAt = now()->timestamp;

        foreach ($this->questions() as $question) {
            $this->responses[$question->id] = $question->question_type === 'matching' ? [] : '';
        }
    }

    public function submitAnswers(): void
    {
        try {
            $this->validate($this->rules(), $this->messages());
        } catch (ValidationException $exception) {
            $this->resetErrorBag();
            foreach ($exception->errors() as $field => $messages) {
                $this->addError($field, $messages[0] ?? 'This answer is required.');
            }
            $this->dispatch('glms-toast', message: 'Please answer all questions before submitting.');
            return;
        }

        try {
            /** @var ActivityScoringService $scoringService */
            $scoringService = app(ActivityScoringService::class);

            $attempt = $scoringService->evaluateAndStore(
                auth()->user(),
                $this->activity,
                $this->responses,
                max(0, now()->timestamp - $this->startedAt),
                $this->selectedQuestionIds
            );
        } catch (\Throwable $exception) {
            report($exception);
            $this->dispatch('glms-toast', message: 'Unable to submit right now. Please try again.');
            return;
        }

        $this->result = [
            'score' => (float) $attempt->score,
            'max_score' => (float) $attempt->max_score,
            'accuracy' => (float) $attempt->accuracy,
            'feedback' => $attempt->feedback_summary,
        ];

        $this->dispatch('activity-completed');
        $this->dispatch('glms-toast', message: 'Answers submitted successfully.');
    }

    public function retry(): void
    {
        if (! $this->activity->allow_retry) {
            return;
        }

        foreach ($this->questions() as $question) {
            $this->responses[$question->id] = $question->question_type === 'matching' ? [] : '';
        }

        $this->result = null;
        $this->startedAt = now()->timestamp;
    }

    public function render()
    {
        return view('livewire.student.activity-player', ['questions' => $this->questions()]);
    }

    protected function questions()
    {
        $found = Question::query()->with('choices')->whereIn('id', $this->selectedQuestionIds)->get()->keyBy('id');
        return collect($this->selectedQuestionIds)->map(fn ($id) => $found->get($id))->filter()->values();
    }

    /**
     * @return array<string, array<int, string>>
     */
    protected function rules(): array
    {
        $rules = [];

        foreach ($this->questions() as $question) {
            if ($question->question_type === 'matching') {
                foreach ($question->matchingPairs() as $pair) {
                    $key = $pair['key'] ?? null;
                    if (! $key) {
                        continue;
                    }
                    $rules["responses.{$question->id}.{$key}"] = ['required', 'string'];
                }
                continue;
            }

            $rules["responses.{$question->id}"] = ['required', 'string'];
        }

        return $rules;
    }

    /**
     * @return array<string, string>
     */
    protected function messages(): array
    {
        $messages = [];
        foreach ($this->questions() as $question) {
            if ($question->question_type === 'matching') {
                foreach ($question->matchingPairs() as $pair) {
                    $key = $pair['key'] ?? null;
                    if (! $key) {
                        continue;
                    }
                    $messages["responses.{$question->id}.{$key}.required"] = 'Answer all matching items before submitting.';
                }
                continue;
            }

            $messages["responses.{$question->id}.required"] = 'Answer all questions before submitting.';
        }

        return $messages;
    }
}
