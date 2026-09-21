<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Report;
use App\Models\User;

class ReportPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === UserRole::TEACHER;
    }

    public function view(User $user, Report $report): bool
    {
        return $user->role === UserRole::TEACHER && $report->generated_by === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->role === UserRole::TEACHER;
    }
}

