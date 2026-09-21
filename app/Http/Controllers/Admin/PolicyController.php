<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GradingPolicy;
use App\Models\Section;
use App\Services\AuditLogService;
use App\Services\GradingPolicyService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class PolicyController extends Controller
{
    public function index(): View
    {
        return view('admin.policies.index', [
            'policies' => GradingPolicy::query()
                ->with(['section:id,name', 'creator:id,name'])
                ->latest('id')
                ->paginate(12),
            'sections' => Section::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(
        Request $request,
        GradingPolicyService $gradingPolicyService,
        AuditLogService $auditLogService
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'scope' => ['required', Rule::in(['global', 'section'])],
            'section_id' => ['nullable', 'integer', Rule::exists('sections', 'id')],
            'subject' => ['nullable', 'string', 'max:120'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'mastery_threshold' => ['required', 'numeric', 'min:50', 'max:100'],
            'attainment_threshold' => ['required', 'numeric', 'min:50', 'max:100'],
            'gamified_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'formative_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'summative_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'weekly_summative_required' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if ($validated['scope'] === 'section' && empty($validated['section_id'])) {
            return redirect()->route('admin.policies.index')->withErrors([
                'section_id' => 'Section is required for section-scoped policy.',
            ]);
        }

        $gradingPolicyService->validateWeights($validated);

        $policy = GradingPolicy::query()->create([
            'name' => $validated['name'],
            'scope' => $validated['scope'],
            'section_id' => $validated['scope'] === 'section' ? ($validated['section_id'] ?? null) : null,
            'subject' => $validated['subject'] ?? null,
            'effective_from' => $validated['effective_from'] ?? null,
            'effective_to' => $validated['effective_to'] ?? null,
            'mastery_threshold' => $validated['mastery_threshold'],
            'attainment_threshold' => $validated['attainment_threshold'],
            'gamified_weight' => $validated['gamified_weight'],
            'formative_weight' => $validated['formative_weight'],
            'summative_weight' => $validated['summative_weight'],
            'weekly_summative_required' => $request->boolean('weekly_summative_required'),
            'is_active' => $request->boolean('is_active', true),
            'created_by' => $request->user()->id,
        ]);

        $auditLogService->log(
            $request->user(),
            'admin.policy.created',
            'grading_policy',
            $policy->id,
            [
                'scope' => $policy->scope,
                'subject' => $policy->subject,
            ],
            $request
        );

        return redirect()->route('admin.policies.index')->with('status', 'Grading policy created.');
    }

    public function update(
        Request $request,
        GradingPolicy $policy,
        GradingPolicyService $gradingPolicyService,
        AuditLogService $auditLogService
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'scope' => ['required', Rule::in(['global', 'section'])],
            'section_id' => ['nullable', 'integer', Rule::exists('sections', 'id')],
            'subject' => ['nullable', 'string', 'max:120'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'mastery_threshold' => ['required', 'numeric', 'min:50', 'max:100'],
            'attainment_threshold' => ['required', 'numeric', 'min:50', 'max:100'],
            'gamified_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'formative_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'summative_weight' => ['required', 'integer', 'min:0', 'max:100'],
            'weekly_summative_required' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if ($validated['scope'] === 'section' && empty($validated['section_id'])) {
            return redirect()->route('admin.policies.index')->withErrors([
                'section_id' => 'Section is required for section-scoped policy.',
            ]);
        }

        $gradingPolicyService->validateWeights($validated);

        $policy->update([
            'name' => $validated['name'],
            'scope' => $validated['scope'],
            'section_id' => $validated['scope'] === 'section' ? ($validated['section_id'] ?? null) : null,
            'subject' => $validated['subject'] ?? null,
            'effective_from' => $validated['effective_from'] ?? null,
            'effective_to' => $validated['effective_to'] ?? null,
            'mastery_threshold' => $validated['mastery_threshold'],
            'attainment_threshold' => $validated['attainment_threshold'],
            'gamified_weight' => $validated['gamified_weight'],
            'formative_weight' => $validated['formative_weight'],
            'summative_weight' => $validated['summative_weight'],
            'weekly_summative_required' => $request->boolean('weekly_summative_required'),
            'is_active' => $request->boolean('is_active', true),
        ]);

        $auditLogService->log(
            $request->user(),
            'admin.policy.updated',
            'grading_policy',
            $policy->id,
            [
                'scope' => $policy->scope,
                'subject' => $policy->subject,
            ],
            $request
        );

        return redirect()->route('admin.policies.index')->with('status', 'Grading policy updated.');
    }
}
