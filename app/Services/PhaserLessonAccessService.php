<?php

namespace App\Services;

use App\Models\Section;
use App\Models\SectionPhaserMajorLock;
use App\Models\SectionPhaserLessonLock;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PhaserLessonAccessService
{
    public const LOCKED_MESSAGE = 'This lesson is locked by your teacher.';

    /**
     * @return array<string, array<string, int|string>>
     */
    public function managedLessons(): array
    {
        return $this->lessonCatalog()
            ->all();
    }

    /**
     * @return list<string>
     */
    public function managedLessonKeys(): array
    {
        return array_keys($this->managedLessons());
    }

    /**
     * @return array<string, array<string, int|string>>
     */
    public function managedMajors(): array
    {
        return $this->majorCatalog()
            ->all();
    }

    /**
     * @return list<string>
     */
    public function managedMajorKeys(): array
    {
        return array_keys($this->managedMajors());
    }

    public function supportsLessonKey(string $lessonKey): bool
    {
        return isset($this->managedLessons()[$lessonKey]);
    }

    public function supportsMajorKey(string $majorKey): bool
    {
        return isset($this->managedMajors()[$majorKey]);
    }

    /**
     * @return list<string>
     */
    public function lockedLessonKeysForSection(?int $sectionId): array
    {
        if (! $sectionId) {
            return [];
        }

        return SectionPhaserLessonLock::query()
            ->where('section_id', $sectionId)
            ->whereIn('lesson_key', $this->managedLessonKeys())
            ->orderBy('lesson_key')
            ->pluck('lesson_key')
            ->all();
    }

    /**
     * @return list<string>
     */
    public function lockedMajorKeysForSection(?int $sectionId): array
    {
        if (! $sectionId) {
            return [];
        }

        return SectionPhaserMajorLock::query()
            ->where('section_id', $sectionId)
            ->whereIn('major_key', $this->managedMajorKeys())
            ->orderBy('major_key')
            ->pluck('major_key')
            ->all();
    }

    /**
     * @return list<array<string, bool|int|string|null>>
     */
    public function sectionLessonStates(?int $sectionId): array
    {
        return collect($this->sectionAccessGroups($sectionId))
            ->flatMap(static fn (array $quarter): array => $quarter['majors'])
            ->flatMap(static fn (array $major): array => $major['lessons'])
            ->values()
            ->all();
    }

    /**
     * @return array<string, array{locked: bool, title: string, lessonNumber: int, topicTitle: string, lockReason: string|null, parentMajorKey: string, parentMajorTitle: string}>
     */
    public function accessMapForSection(?int $sectionId): array
    {
        return $this->runtimeAccessForSection($sectionId)['lessonAccess'];
    }

    public function isLocked(?int $sectionId, string $lessonKey): bool
    {
        return (bool) ($this->lessonAccessEntry($sectionId, $lessonKey)['locked'] ?? false);
    }

    public function ensureUnlocked(?int $sectionId, string $lessonKey): void
    {
        $lessonAccess = $this->lessonAccessEntry($sectionId, $lessonKey);

        if (($lessonAccess['locked'] ?? false) === true) {
            throw ValidationException::withMessages([
                'lesson_key' => $this->lockMessageForLesson($lessonAccess),
            ]);
        }
    }

    /**
     * @return array{majorAccess: array<string, array{locked: bool, title: string, quarterKey: string, quarterLabel: string, majorNumber: int}>, lessonAccess: array<string, array{locked: bool, title: string, lessonNumber: int, topicTitle: string, lockReason: string|null, parentMajorKey: string, parentMajorTitle: string}>}
     */
    public function runtimeAccessForSection(?int $sectionId): array
    {
        $groups = $this->sectionAccessGroups($sectionId);

        return [
            'majorAccess' => collect($groups)
                ->flatMap(static fn (array $quarter): array => $quarter['majors'])
                ->mapWithKeys(static fn (array $major): array => [
                    $major['major_key'] => [
                        'locked' => (bool) $major['locked'],
                        'title' => (string) $major['title'],
                        'quarterKey' => (string) $major['quarter_key'],
                        'quarterLabel' => (string) $major['quarter_label'],
                        'majorNumber' => (int) $major['major_number'],
                    ],
                ])
                ->all(),
            'lessonAccess' => collect($groups)
                ->flatMap(static fn (array $quarter): array => $quarter['majors'])
                ->flatMap(static fn (array $major): array => $major['lessons'])
                ->mapWithKeys(static fn (array $lesson): array => [
                    $lesson['lesson_key'] => [
                        'locked' => (bool) $lesson['locked'],
                        'title' => (string) $lesson['title'],
                        'lessonNumber' => (int) $lesson['lesson_number'],
                        'topicTitle' => sprintf(
                            '%s %s - %s',
                            (string) $lesson['quarter_label'],
                            strtoupper((string) $lesson['quarter_title']),
                            strtoupper((string) $lesson['parent_major_title']),
                        ),
                        'lockReason' => $lesson['lock_reason'] ? (string) $lesson['lock_reason'] : null,
                        'parentMajorKey' => (string) $lesson['parent_major_key'],
                        'parentMajorTitle' => (string) $lesson['parent_major_title'],
                    ],
                ])
                ->all(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function sectionAccessGroups(?int $sectionId): array
    {
        $lockedMajorKeys = array_flip($this->lockedMajorKeysForSection($sectionId));
        $lockedLessonKeys = array_flip($this->lockedLessonKeysForSection($sectionId));

        return $this->quarterCatalog()
            ->map(function (array $quarter) use ($lockedMajorKeys, $lockedLessonKeys): array {
                return [
                    'quarter_key' => $quarter['quarter_key'],
                    'label' => $quarter['label'],
                    'title' => $quarter['title'],
                    'subtitle' => $quarter['subtitle'],
                    'majors' => collect($quarter['majors'])
                        ->map(function (array $major) use ($lockedMajorKeys, $lockedLessonKeys): array {
                            $majorLocked = isset($lockedMajorKeys[$major['major_key']]);

                            return [
                                'major_key' => $major['major_key'],
                                'quarter_key' => $major['quarter_key'],
                                'quarter_label' => $major['quarter_label'],
                                'quarter_title' => $major['quarter_title'],
                                'major_number' => $major['major_number'],
                                'title' => $major['title'],
                                'icon' => $major['icon'],
                                'locked' => $majorLocked,
                                'explicit_locked' => $majorLocked,
                                'lessons' => collect($major['lessons'])
                                    ->map(function (array $lesson) use ($majorLocked, $lockedLessonKeys): array {
                                        $explicitLessonLocked = isset($lockedLessonKeys[$lesson['lesson_key']]);
                                        $lockReason = $majorLocked ? 'major' : ($explicitLessonLocked ? 'lesson' : null);

                                        return [
                                            'lesson_key' => $lesson['lesson_key'],
                                            'quarter_key' => $lesson['quarter_key'],
                                            'quarter_label' => $lesson['quarter_label'],
                                            'quarter_title' => $lesson['quarter_title'],
                                            'parent_major_key' => $lesson['parent_major_key'],
                                            'parent_major_title' => $lesson['parent_major_title'],
                                            'lesson_number' => $lesson['lesson_number'],
                                            'title' => $lesson['title'],
                                            'locked' => $majorLocked || $explicitLessonLocked,
                                            'explicit_locked' => $explicitLessonLocked,
                                            'inherited_locked' => $majorLocked,
                                            'lock_reason' => $lockReason,
                                        ];
                                    })
                                    ->values()
                                    ->all(),
                            ];
                        })
                        ->values()
                        ->all(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function lessonAccessEntry(?int $sectionId, string $lessonKey): array
    {
        return $this->accessMapForSection($sectionId)[$lessonKey] ?? ['locked' => false];
    }

    /**
     * @return array<string, mixed>
     */
    public function majorAccessEntry(?int $sectionId, string $majorKey): array
    {
        return $this->runtimeAccessForSection($sectionId)['majorAccess'][$majorKey] ?? ['locked' => false];
    }

    /**
     * @param  array<int, string>  $lockedMajorKeys
     * @param  array<int, string>  $lockedLessonKeys
     */
    public function syncLocks(Section $section, array $lockedMajorKeys, array $lockedLessonKeys, int $lockedBy): void
    {
        $managedMajorKeys = $this->managedMajorKeys();
        $managedLessonKeys = $this->managedLessonKeys();

        $desiredMajorKeys = collect($lockedMajorKeys)
            ->map(static fn (mixed $majorKey): string => (string) $majorKey)
            ->filter(fn (string $majorKey): bool => in_array($majorKey, $managedMajorKeys, true))
            ->unique()
            ->values();

        $desiredLessonKeys = collect($lockedLessonKeys)
            ->map(static fn (mixed $lessonKey): string => (string) $lessonKey)
            ->filter(fn (string $lessonKey): bool => in_array($lessonKey, $managedLessonKeys, true))
            ->unique()
            ->values();

        DB::transaction(function () use ($section, $managedMajorKeys, $managedLessonKeys, $desiredMajorKeys, $desiredLessonKeys, $lockedBy): void {
            SectionPhaserMajorLock::query()
                ->where('section_id', $section->id)
                ->whereIn('major_key', $managedMajorKeys)
                ->delete();

            SectionPhaserLessonLock::query()
                ->where('section_id', $section->id)
                ->whereIn('lesson_key', $managedLessonKeys)
                ->delete();

            $timestamp = now();

            if ($desiredMajorKeys->isNotEmpty()) {
                SectionPhaserMajorLock::query()->insert(
                    $desiredMajorKeys
                        ->map(fn (string $majorKey): array => [
                            'section_id' => $section->id,
                            'major_key' => $majorKey,
                            'locked_by' => $lockedBy,
                            'created_at' => $timestamp,
                            'updated_at' => $timestamp,
                        ])
                        ->all()
                );
            }

            if ($desiredLessonKeys->isNotEmpty()) {
                SectionPhaserLessonLock::query()->insert(
                    $desiredLessonKeys
                        ->map(fn (string $lessonKey): array => [
                            'section_id' => $section->id,
                            'lesson_key' => $lessonKey,
                            'locked_by' => $lockedBy,
                            'created_at' => $timestamp,
                            'updated_at' => $timestamp,
                        ])
                        ->all()
                );
            }
        });
    }

    /**
     * @param  array<string, mixed>  $lessonAccess
     */
    private function lockMessageForLesson(array $lessonAccess): string
    {
        if (($lessonAccess['lockReason'] ?? null) === 'major' && ! empty($lessonAccess['parentMajorTitle'])) {
            return sprintf(
                'This lesson is locked because %s is locked by your teacher.',
                (string) $lessonAccess['parentMajorTitle'],
            );
        }

        return self::LOCKED_MESSAGE;
    }

    /**
     * @return Collection<string, array<string, mixed>>
     */
    private function quarterCatalog(): Collection
    {
        return collect(config('phaser_map.quarters', []))
            ->filter(static fn (mixed $quarter): bool => is_array($quarter))
            ->sortKeysUsing('strnatcmp');
    }

    /**
     * @return Collection<string, array<string, mixed>>
     */
    private function majorCatalog(): Collection
    {
        return $this->quarterCatalog()
            ->flatMap(static fn (array $quarter): array => is_array($quarter['majors'] ?? null) ? $quarter['majors'] : [])
            ->filter(static fn (mixed $major): bool => is_array($major))
            ->sortKeysUsing('strnatcmp');
    }

    /**
     * @return Collection<string, array<string, mixed>>
     */
    private function lessonCatalog(): Collection
    {
        return $this->majorCatalog()
            ->flatMap(static fn (array $major): array => is_array($major['lessons'] ?? null) ? $major['lessons'] : [])
            ->filter(static fn (mixed $lesson): bool => is_array($lesson))
            ->sortKeysUsing('strnatcmp');
    }
}
