<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class StudentProfile extends Model
{
    /** @use HasFactory<\Database\Factories\StudentProfileFactory> */
    use HasFactory;

    public const SPLIT_NAME_SCHEMA_MESSAGE = 'Database schema is outdated. Run migrations and try again.';

    protected $fillable = [
        'user_id',
        'section_id',
        'first_name',
        'middle_name',
        'last_name',
        'learner_reference',
        'birth_date',
        'guardian_name',
        'avatar_path',
        'learning_goal',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public static function composeDisplayName(string $firstName, ?string $middleName, string $lastName): string
    {
        return collect([
            static::cleanNamePart($firstName),
            static::cleanNamePart($middleName),
            static::cleanNamePart($lastName),
        ])->filter(fn (?string $value): bool => filled($value))->join(' ');
    }

    public static function cleanNamePart(?string $value): ?string
    {
        $cleaned = preg_replace('/\s+/', ' ', trim((string) $value));

        return $cleaned === '' ? null : $cleaned;
    }

    public static function normalizedNamePart(?string $value): string
    {
        return Str::lower(static::cleanNamePart($value) ?? '');
    }

    public static function generateLearnerReference(): string
    {
        do {
            $reference = 'LRN-'.now()->format('ymd').str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        } while (static::query()->where('learner_reference', $reference)->exists());

        return $reference;
    }

    public static function hasSplitNameSchema(): bool
    {
        static $hasSplitNameSchema;

        return $hasSplitNameSchema ??= Schema::hasColumns('student_profiles', [
            'first_name',
            'middle_name',
            'last_name',
        ]);
    }
}
