<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class ProfileController extends Controller
{
    public function edit(Request $request): View
    {
        $user = $request->user()->load('teacherProfile');

        return view('teacher.profile.edit', [
            'user' => $user,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user()->load('teacherProfile');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'title' => ['nullable', 'string', 'max:255'],
            'specialization' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:800'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        $user->teacherProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'title' => $validated['title'] ?? null,
                'specialization' => $validated['specialization'] ?? null,
                'bio' => $validated['bio'] ?? null,
            ]
        );

        return redirect()->route('teacher.profile.edit')->with('status', 'Profile updated successfully.');
    }
}

