<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Attempt;
use App\Models\User;

class AttemptPolicy
{
    public function view(User $user, Attempt $attempt): bool
    {
        return $user->role === UserRole::TEACHER || $attempt->student_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::STUDENT;
    }
}

