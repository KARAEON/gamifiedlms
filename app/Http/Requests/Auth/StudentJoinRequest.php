<?php

namespace App\Http\Requests\Auth;

use App\Models\StudentProfile;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentJoinRequest extends FormRequest
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
            'last_name' => ['required', 'string', 'max:120'],
            'first_name' => ['required', 'string', 'max:120'],
            'middle_name' => ['nullable', 'string', 'max:120'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users', 'email')],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'last_name' => StudentProfile::cleanNamePart($this->input('last_name')),
            'first_name' => StudentProfile::cleanNamePart($this->input('first_name')),
            'middle_name' => StudentProfile::cleanNamePart($this->input('middle_name')),
            'email' => strtolower(trim((string) $this->input('email'))),
        ]);
    }
}
