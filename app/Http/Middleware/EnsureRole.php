<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $roleValues = array_map(
            static fn (string $role): string => UserRole::tryFrom($role)?->value ?? $role,
            $roles
        );

        if (! in_array($user->role->value, $roleValues, true)) {
            abort(403, 'You are not authorized to access this area.');
        }

        return $next($request);
    }
}

