<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Concerns\GuardsStudentProfileSchema;
use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class ProfileController extends Controller
{
    use GuardsStudentProfileSchema;

    public function edit(Request $request): View|RedirectResponse
    {
        if ($response = $this->ensureStudentProfileSplitNameSchema('student.dashboard')) {
            return $response;
        }

        $user = $request->user()->load('studentProfile.section');

        return view('student.profile.edit', [
            'user' => $user,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        if ($response = $this->ensureStudentProfileSplitNameSchema('student.profile.edit', true)) {
            return $response;
        }

        $user = $request->user()->load('studentProfile');

        $validated = $request->validate([
            'last_name' => ['required', 'string', 'max:120'],
            'first_name' => ['required', 'string', 'max:120'],
            'middle_name' => ['nullable', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'guardian_name' => ['nullable', 'string', 'max:255'],
            'learning_goal' => ['nullable', 'string', 'max:500'],
        ]);

        $user->update([
            'name' => StudentProfile::composeDisplayName(
                (string) $validated['first_name'],
                $validated['middle_name'] ?? null,
                (string) $validated['last_name'],
            ),
            'email' => $validated['email'],
        ]);

        $user->studentProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'section_id' => $user->studentProfile?->section_id,
                'first_name' => StudentProfile::cleanNamePart($validated['first_name']),
                'middle_name' => StudentProfile::cleanNamePart($validated['middle_name'] ?? null),
                'last_name' => StudentProfile::cleanNamePart($validated['last_name']),
                'learner_reference' => $user->studentProfile?->learner_reference ?? StudentProfile::generateLearnerReference(),
                'guardian_name' => $validated['guardian_name'] ?? null,
                'learning_goal' => $validated['learning_goal'] ?? null,
            ]
        );

        return redirect()->route('student.profile.edit')->with('status', 'Profile updated successfully.');
    }
}
