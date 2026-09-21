<?php

namespace App\Http\Requests\Auth;

use App\Models\StudentProfile;
use Illuminate\Foundation\Http\FormRequest;

class StudentCodeLoginRequest extends FormRequest
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
        return [
            'section_code' => ['required', 'string', 'max:50'],
            'last_name' => ['required', 'string', 'max:120'],
            'first_name' => ['required', 'string', 'max:120'],
            'middle_name' => ['nullable', 'string', 'max:120'],
            'learner_reference' => ['nullable', 'string', 'max:50'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'section_code' => strtoupper(trim((string) $this->input('section_code'))),
            'last_name' => StudentProfile::cleanNamePart($this->input('last_name')),
            'first_name' => StudentProfile::cleanNamePart($this->input('first_name')),
            'middle_name' => StudentProfile::cleanNamePart($this->input('middle_name')),
            'learner_reference' => trim((string) $this->input('learner_reference')) ?: null,
        ]);
    }
}
