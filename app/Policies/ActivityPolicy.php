<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Activity;
use App\Models\User;

class ActivityPolicy
{
    public function view(User $user, Activity $activity): bool
    {
        if ($user->role === UserRole::TEACHER) {
            return true;
        }

        return $user->role === UserRole::STUDENT && $activity->is_active;
    }

    public function update(User $user): bool
    {
        return $user->role === UserRole::TEACHER;
    }
}

