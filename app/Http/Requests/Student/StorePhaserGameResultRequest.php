<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePhaserGameResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'submission_uuid' => ['required', 'uuid'],
            'entry_type' => ['required', Rule::in(['minigame', 'assessment'])],
            'lesson_key' => ['required', 'string', 'max:40'],
            'game_key' => ['required', 'string', 'max:80'],
            'payload' => ['required', 'array'],
        ];
    }
}
