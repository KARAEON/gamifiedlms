<?php

namespace App\Livewire\Teacher;

use App\Models\Lesson;
use App\Models\Section;
use App\Models\Topic;
use App\Models\User;
use App\Services\AnalyticsService;
use Livewire\Attributes\Url;
use Livewire\Component;

class AnalyticsExplorer extends Component
{
    #[Url]
    public ?string $date_from = null;

    #[Url]
    public ?string $date_to = null;

    #[Url]
    public ?int $student_id = null;

    #[Url]
    public ?int $section_id = null;

    #[Url]
    public ?int $lesson_id = null;

    #[Url]
    public ?int $topic_id = null;

    #[Url]
    public ?string $activity_type = null;

    public function mount(): void
    {
        $this->date_from ??= now()->subDays(30)->toDateString();
        $this->date_to ??= now()->toDateString();
    }

    public function applyFilters(): void
    {
        if ($this->date_from && $this->date_to && $this->date_from > $this->date_to) {
            [$this->date_from, $this->date_to] = [$this->date_to, $this->date_from];
        }
    }

    public function setQuickRange(int $days): void
    {
        $this->date_to = now()->toDateString();
        $this->date_from = now()->subDays(max(0, $days - 1))->toDateString();
    }

    public function clearFilters(): void
    {
        $this->date_from = now()->subDays(30)->toDateString();
        $this->date_to = now()->toDateString();
        $this->student_id = null;
        $this->section_id = null;
        $this->lesson_id = null;
        $this->topic_id = null;
        $this->activity_type = null;
    }

    public function render(AnalyticsService $analyticsService)
    {
        $sectionIds = auth()->user()->handledSections()->pluck('sections.id');
        $gameRecords = app(\App\Services\GameAnalyticsRecords::class)->records(['section_ids' => $sectionIds->all()]);
        return view('livewire.teacher.analytics-explorer', [
            'analytics' => $analyticsService->teacherAnalytics($this->filters()),
            'students' => User::query()->where('role', 'student')->whereHas('studentProfile', fn ($q) => $q->whereIn('section_id', $sectionIds))->orderBy('name')->get(['id', 'name']),
            'sections' => Section::query()->whereIn('id', $sectionIds)->orderBy('name')->get(['id', 'name']),
            'lessons' => Lesson::query()->orderBy('title')->get(['id', 'title'])->concat($gameRecords->pluck('lesson')->unique('id'))->values(),
            'topics' => Topic::query()->orderBy('title')->get(['id', 'title'])->concat($gameRecords->pluck('topic')->unique('id'))->values(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function filters(): array
    {
        return array_filter([
            'date_from' => $this->date_from,
            'date_to' => $this->date_to,
            'student_id' => $this->student_id,
            'section_id' => $this->section_id,
            'lesson_id' => $this->lesson_id,
            'topic_id' => $this->topic_id,
            'activity_type' => $this->activity_type,
        ], fn ($value): bool => $value !== null && $value !== '');
    }
}
