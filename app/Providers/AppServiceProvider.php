<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Paginator::useTailwind();

        // Render terminates TLS at its edge proxy. Force secure URLs inside the
        // container so assets, form actions, and game resources are never
        // emitted as blocked http:// links on the public HTTPS site.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
    }
}
