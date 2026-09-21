<?php

namespace App\Http\Requests\Teacher;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTopicRequest extends FormRequest
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
        $topic = $this->route('topic');

        return [
            'lesson_id' => ['required', 'integer', Rule::exists('lessons', 'id')],
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('topics', 'slug')->ignore($topic?->id)],
            'summary' => ['nullable', 'string'],
            'difficulty_level' => ['required', 'integer', 'between:1,5'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}

