<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class RegisteredUserController extends Controller
{
    public function create(): View
    {
        return view('auth.register');
    }

    public function store(RegisterRequest $request): RedirectResponse
    {
        /** @var array<string, mixed> $validated */
        $validated = $request->validated();

        $user = DB::transaction(function () use ($validated): User {
            $user = User::query()->create([
                'name' => (string) $validated['name'],
                'email' => (string) $validated['email'],
                'role' => 'teacher',
                'password' => Hash::make((string) $validated['password']),
            ]);

            TeacherProfile::query()->create([
                'user_id' => $user->id,
                'title' => $validated['teacher_title'] ?? 'Science Teacher',
                'specialization' => $validated['teacher_specialization'] ?? null,
                'bio' => 'Newly registered teacher account.',
            ]);

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('teacher.dashboard')
            ->with('status', 'Teacher account created successfully.');
    }
}
