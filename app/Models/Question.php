<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Question extends Model
{
    /** @use HasFactory<\Database\Factories\QuestionFactory> */
    use HasFactory;

    protected $fillable = [
        'activity_id',
        'prompt',
        'question_type',
        'payload',
        'correct_answer',
        'media_path',
        'points',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    public function choices(): HasMany
    {
        return $this->hasMany(Choice::class)->orderBy('sort_order');
    }

    public function attemptAnswers(): HasMany
    {
        return $this->hasMany(AttemptAnswer::class);
    }

    public function wordPuzzleAnswer(): string
    {
        if (! in_array($this->question_type, ['guess_word', 'pics_word'], true)) {
            return trim((string) $this->correct_answer);
        }

        if ($this->isLikelyDemoGenerated()) {
            $answers = $this->question_type === 'guess_word'
                ? self::demoGuessWordAnswers()
                : self::demoPicsWordAnswers();

            $index = max(0, ($this->sort_order ?: 1) - 1) % count($answers);

            return $answers[$index];
        }

        $explicit = trim((string) data_get($this->payload, 'answer', ''));
        if ($explicit !== '') {
            return Str::lower($explicit);
        }

        return Str::lower(trim((string) $this->correct_answer));
    }

    public function wordPuzzleClue(): string
    {
        $payloadClue = trim((string) data_get($this->payload, 'clue', data_get($this->payload, 'hint', '')));
        if ($payloadClue !== '' && ! $this->isLikelyDemoGenerated()) {
            return $payloadClue;
        }

        $answer = $this->wordPuzzleAnswer();

        return self::wordClueByAnswer()[$answer] ?? 'Use the clue to guess the science word.';
    }

    public function guessWordImage(): ?string
    {
        if ($this->question_type !== 'guess_word') {
            return null;
        }

        $payloadImage = trim((string) data_get($this->payload, 'image', ''));
        if ($payloadImage !== '' && $this->isPhotoLikeImage($payloadImage) && ! $this->isLikelyDemoGenerated()) {
            return $payloadImage;
        }

        return self::guessWordImageByAnswer()[$this->wordPuzzleAnswer()] ?? null;
    }

    public function wordPuzzleFirstLetter(): string
    {
        $answer = $this->wordPuzzleAnswer();
        if ($answer === '') {
            return '';
        }

        return Str::upper(Str::substr($answer, 0, 1));
    }

    public function wordPuzzleLength(): int
    {
        return Str::length($this->wordPuzzleAnswer());
    }

    /**
     * @return array<int, array{key: string, left: string, right: string}>
     */
    public function matchingPairs(): array
    {
        if ($this->question_type !== 'matching') {
            return [];
        }

        $pairs = collect((array) data_get($this->payload, 'pairs', []))
            ->map(function (mixed $pair): ?array {
                if (! is_array($pair)) {
                    return null;
                }

                $key = trim((string) ($pair['key'] ?? ''));
                $left = trim((string) ($pair['left'] ?? ''));
                $right = trim((string) ($pair['right'] ?? ''));

                if ($key === '' || $left === '' || $right === '') {
                    return null;
                }

                return [
                    'key' => $key,
                    'left' => $left,
                    'right' => $right,
                ];
            })
            ->filter()
            ->values()
            ->all();

        if (count($pairs) >= 2 && ! $this->matchingLooksGeneric($pairs)) {
            return $pairs;
        }

        return self::matchingPairSetForOrder($this->sort_order ?: 1);
    }

    /**
     * @return array<string, string>
     */
    public function matchingCorrectMap(): array
    {
        $map = [];
        foreach ($this->matchingPairs() as $pair) {
            $map[$pair['key']] = $pair['right'];
        }

        return $map;
    }

    /**
     * @return array<int, string>
     */
    public function picsWordImages(): array
    {
        if ($this->question_type !== 'pics_word') {
            return [];
        }

        $images = collect((array) data_get($this->payload, 'images', []))
            ->filter(fn (mixed $image): bool => is_string($image) && trim($image) !== '')
            ->map(fn (string $image): string => trim($image))
            ->values()
            ->all();

        $allArePhotos = count($images) >= 4 && collect($images)->every(
            fn (string $image): bool => $this->isPhotoLikeImage($image)
        );

        if ($allArePhotos && ! $this->isLikelyDemoGenerated()) {
            return array_values(array_slice($images, 0, 4));
        }

        return self::picsWordImageSet($this->wordPuzzleAnswer());
    }

    /**
     * @return array<int, string>
     */
    public static function picsWordImageSet(string $answer): array
    {
        $key = Str::lower(trim($answer));

        $map = [
            'planet' => ['planet-1', 'planet-2', 'planet-3', 'planet-4'],
            'erosion' => ['erosion-1', 'erosion-2', 'erosion-3', 'erosion-4'],
            'ecosystem' => ['ecosystem-1', 'ecosystem-2', 'ecosystem-3', 'ecosystem-4'],
            'thunder' => ['thunder-1', 'thunder-2', 'thunder-3', 'thunder-4'],
            'circuit' => ['circuit-1', 'circuit-2', 'circuit-3', 'circuit-4'],
        ];

        $slugs = $map[$key] ?? ['planet-1', 'planet-2', 'planet-3', 'planet-4'];

        return array_map(
            static fn (string $slug): string => "/images/pics-word-real/{$slug}.jpg",
            $slugs
        );
    }

    /**
     * @return array<int, string>
     */
    public static function demoGuessWordAnswers(): array
    {
        return ['energy', 'habitat', 'gravity', 'climate', 'molecule'];
    }

    /**
     * @return array<int, string>
     */
    public static function demoPicsWordAnswers(): array
    {
        return ['planet', 'erosion', 'ecosystem', 'thunder', 'circuit'];
    }

    /**
     * @return array<string, string>
     */
    public static function wordClueByAnswer(): array
    {
        return [
            'energy' => 'Science clue: It is the ability to do work and make things move or change.',
            'habitat' => 'Science clue: This is the natural home where plants and animals live.',
            'gravity' => 'Science clue: It pulls objects toward Earth.',
            'climate' => 'Science clue: Long-term weather pattern of a place.',
            'molecule' => 'Science clue: A tiny particle made of two or more atoms.',
            'planet' => 'Science clue: A large round body that orbits a star.',
            'erosion' => 'Science clue: Rock or soil is worn away by water, wind, or ice.',
            'ecosystem' => 'Science clue: Living and non-living things interacting in one environment.',
            'thunder' => 'Science clue: The loud sound produced after lightning.',
            'circuit' => 'Science clue: A complete path where electric current can flow.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function guessWordImageByAnswer(): array
    {
        return [
            'energy' => '/images/pics-word-real/circuit-3.jpg',
            'habitat' => '/images/pics-word-real/ecosystem-4.jpg',
            'gravity' => '/images/pics-word-real/planet-1.jpg',
            'climate' => '/images/pics-word-real/thunder-2.jpg',
            'molecule' => '/images/pics-word-real/circuit-2.jpg',
            'planet' => '/images/pics-word-real/planet-2.jpg',
            'erosion' => '/images/pics-word-real/erosion-1.jpg',
            'ecosystem' => '/images/pics-word-real/ecosystem-2.jpg',
            'thunder' => '/images/pics-word-real/thunder-1.jpg',
            'circuit' => '/images/pics-word-real/circuit-1.jpg',
        ];
    }

    /**
     * @return array<int, array{key: string, left: string, right: string}>
     */
    public static function matchingPairSetForOrder(int $order): array
    {
        $sets = [
            [
                ['left' => 'Evaporation', 'right' => 'Liquid water changes into water vapor.'],
                ['left' => 'Condensation', 'right' => 'Water vapor cools and forms liquid droplets.'],
            ],
            [
                ['left' => 'Gravity', 'right' => 'Force that pulls objects toward Earth.'],
                ['left' => 'Friction', 'right' => 'Force that opposes motion between surfaces.'],
            ],
            [
                ['left' => 'Conductor', 'right' => 'Material that allows electricity to flow easily.'],
                ['left' => 'Insulator', 'right' => 'Material that resists the flow of electricity.'],
            ],
            [
                ['left' => 'Producer', 'right' => 'Organism that makes its own food.'],
                ['left' => 'Consumer', 'right' => 'Organism that gets energy by eating others.'],
            ],
            [
                ['left' => 'Orbit', 'right' => 'Path followed by a body around another body in space.'],
                ['left' => 'Rotation', 'right' => 'Spinning of an object around its own axis.'],
            ],
        ];

        $index = max(0, $order - 1) % count($sets);
        $set = $sets[$index];

        return [
            ['key' => 'term_a', 'left' => $set[0]['left'], 'right' => $set[0]['right']],
            ['key' => 'term_b', 'left' => $set[1]['left'], 'right' => $set[1]['right']],
        ];
    }

    protected function isLikelyDemoGenerated(): bool
    {
        $prompt = Str::lower((string) $this->prompt);

        return Str::contains($prompt, [
            'guess the science word from clue',
            '4 pics 1 word clue set',
            'match item',
            'choose the correct science fact',
            'identify the visual shown in challenge',
        ]);
    }

    /**
     * @param  array<int, array{key: string, left: string, right: string}>  $pairs
     */
    protected function matchingLooksGeneric(array $pairs): bool
    {
        foreach ($pairs as $pair) {
            if (preg_match('/^term\\s*[a-z0-9]*$/i', $pair['left']) === 1) {
                return true;
            }

            if (preg_match('/^meaning\\s*[a-z0-9]*$/i', $pair['right']) === 1) {
                return true;
            }
        }

        return false;
    }

    protected function isPlaceholderImage(string $image): bool
    {
        $value = Str::lower($image);

        return Str::contains($value, [
            'placehold.co',
            'placeholder.com',
            'via.placeholder.com',
            'dummyimage.com',
        ]);
    }

    protected function isPhotoLikeImage(string $image): bool
    {
        if ($this->isPlaceholderImage($image)) {
            return false;
        }

        $value = Str::lower($image);
        $legacyIllustration = Str::contains($value, ['/images/pics-word/', '/images/clues/', 'science-clue', '.svg']);
        if ($legacyIllustration) {
            return false;
        }

        return Str::endsWith($value, ['.jpg', '.jpeg', '.png', '.webp']);
    }
}
