<?php

namespace App\Http\Controllers\Auth;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class AuthenticatedSessionController extends Controller
{
    public function create(): View
    {
        return view('auth.login');
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        return $this->redirectByRole((string) $request->user()?->role?->value);
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    protected function redirectByRole(string $role): RedirectResponse
    {
        return match ($role) {
            UserRole::ADMIN->value => redirect()->route('admin.dashboard'),
            UserRole::SCHOOL_HEAD->value => redirect()->route('admin.dashboard'),
            UserRole::TEACHER->value => redirect()->route('teacher.dashboard'),
            default => redirect()->route('student.dashboard'),
        };
    }
}
