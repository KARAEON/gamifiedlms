<?php

namespace App\Http\Requests\Teacher;

use App\Models\StudentProfile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
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
        $user = $this->route('student');
        $allowedSectionIds = $this->user()?->handledSections()->pluck('sections.id')->all() ?? [];

        return [
            'last_name' => ['required', 'string', 'max:120'],
            'first_name' => ['required', 'string', 'max:120'],
            'middle_name' => ['nullable', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'section_id' => ['required', 'integer', Rule::in($allowedSectionIds)],
            'learner_reference' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('student_profiles', 'learner_reference')->ignore($user?->studentProfile?->id),
            ],
            'guardian_name' => ['nullable', 'string', 'max:255'],
            'learning_goal' => ['nullable', 'string', 'max:500'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'last_name' => StudentProfile::cleanNamePart($this->input('last_name')),
            'first_name' => StudentProfile::cleanNamePart($this->input('first_name')),
            'middle_name' => StudentProfile::cleanNamePart($this->input('middle_name')),
            'email' => strtolower(trim((string) $this->input('email'))),
            'learner_reference' => trim((string) $this->input('learner_reference')) ?: null,
        ]);
    }
}
