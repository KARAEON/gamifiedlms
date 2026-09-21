<?php

namespace App\Providers;

use App\Models\Activity;
use App\Models\Attempt;
use App\Models\Report;
use App\Models\StudentProfile;
use App\Policies\ActivityPolicy;
use App\Policies\AttemptPolicy;
use App\Policies\ReportPolicy;
use App\Policies\StudentProfilePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Activity::class => ActivityPolicy::class,
        Attempt::class => AttemptPolicy::class,
        Report::class => ReportPolicy::class,
        StudentProfile::class => StudentProfilePolicy::class,
    ];

    public function boot(): void
    {
        //
    }
}

