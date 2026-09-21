<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->string('first_name')->nullable()->after('section_id');
            $table->string('middle_name')->nullable()->after('first_name');
            $table->string('last_name')->nullable()->after('middle_name');
        });

        $profiles = DB::table('student_profiles')
            ->join('users', 'users.id', '=', 'student_profiles.user_id')
            ->select('student_profiles.id', 'student_profiles.learner_reference', 'users.name')
            ->get();

        foreach ($profiles as $profile) {
            $parts = $this->splitLegacyName((string) $profile->name);

            DB::table('student_profiles')
                ->where('id', $profile->id)
                ->update([
                    'first_name' => $parts['first_name'],
                    'middle_name' => $parts['middle_name'],
                    'last_name' => $parts['last_name'],
                    'learner_reference' => $profile->learner_reference ?: $this->legacyLearnerReference((int) $profile->id),
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'middle_name', 'last_name']);
        });
    }

    /**
     * @return array{first_name: ?string, middle_name: ?string, last_name: ?string}
     */
    protected function splitLegacyName(string $name): array
    {
        $cleaned = preg_replace('/\s+/', ' ', trim($name));
        if ($cleaned === '' || $cleaned === null) {
            return [
                'first_name' => null,
                'middle_name' => null,
                'last_name' => null,
            ];
        }

        if (str_contains($cleaned, ',')) {
            [$lastName, $remainder] = array_pad(array_map('trim', explode(',', $cleaned, 2)), 2, '');
            $remainderParts = array_values(array_filter(explode(' ', $remainder)));

            return [
                'first_name' => $remainderParts[0] ?? null,
                'middle_name' => count($remainderParts) > 1 ? implode(' ', array_slice($remainderParts, 1)) : null,
                'last_name' => $lastName !== '' ? $lastName : null,
            ];
        }

        $parts = array_values(array_filter(explode(' ', $cleaned)));

        return [
            'first_name' => $parts[0] ?? null,
            'middle_name' => count($parts) > 2 ? implode(' ', array_slice($parts, 1, -1)) : null,
            'last_name' => count($parts) > 1 ? $parts[count($parts) - 1] : null,
        ];
    }

    protected function legacyLearnerReference(int $profileId): string
    {
        return 'LRN-LEGACY-'.str_pad((string) $profileId, 6, '0', STR_PAD_LEFT);
    }
};
