<?php

namespace App\Http\Requests\Teacher;

use App\Services\PhaserLessonAccessService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSectionPhaserLocksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $managedMajorKeys = app(PhaserLessonAccessService::class)->managedMajorKeys();
        $managedLessonKeys = app(PhaserLessonAccessService::class)->managedLessonKeys();

        return [
            'locked_majors' => ['nullable', 'array'],
            'locked_majors.*' => ['string', Rule::in($managedMajorKeys)],
            'locked_lessons' => ['nullable', 'array'],
            'locked_lessons.*' => ['string', Rule::in($managedLessonKeys)],
        ];
    }
}
