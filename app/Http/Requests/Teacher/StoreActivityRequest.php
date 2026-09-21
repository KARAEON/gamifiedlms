<?php

namespace App\Http\Requests\Teacher;

use App\Enums\ActivityPhase;
use App\Enums\ActivityType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreActivityRequest extends FormRequest
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
            'topic_id' => ['required', 'integer', Rule::exists('topics', 'id')],
            'title' => ['required', 'string', 'max:255'],
            'activity_type' => ['required', Rule::in(array_column(ActivityType::cases(), 'value'))],
            'instructional_phase' => ['required', Rule::in(array_column(ActivityPhase::cases(), 'value'))],
            'instructions' => ['nullable', 'string'],
            'max_score' => ['required', 'integer', 'min:1'],
            'allow_retry' => ['nullable', 'boolean'],
            'time_limit_seconds' => ['nullable', 'integer', 'min:30', 'max:7200'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'settings' => ['nullable', 'array'],
        ];
    }
}
