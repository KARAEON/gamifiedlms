<?php

use App\Http\Middleware\CanonicalizeAuthHost;
use App\Http\Middleware\EnsureRole;
use Illuminate\Http\Request;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'canonical.auth-host' => CanonicalizeAuthHost::class,
            'role' => EnsureRole::class,
        ]);

        $middleware->redirectGuestsTo('/login');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, \Throwable $exception, Request $request) {
            if ($response->getStatusCode() !== 419) {
                return $response;
            }

            if (
                ! $request->is('login')
                && ! $request->is('student/login')
                && ! $request->is('join')
                && ! $request->is('join/*')
                && ! $request->is('register')
            ) {
                return $response;
            }

            $targetRoute = match (true) {
                $request->is('student/login') => 'student.access.create',
                $request->is('join'), $request->is('join/*') => 'student.join.create',
                $request->is('register') => 'register',
                default => 'login',
            };

            $targetPath = route($targetRoute, ['expired' => 1], false);
            $configuredAppUrl = rtrim((string) config('app.url'), '/');
            $redirectTarget = app()->environment('local') && $configuredAppUrl !== ''
                ? $configuredAppUrl.$targetPath
                : $targetPath;

            return redirect()
                ->to($redirectTarget)
                ->with('status', 'This page expired. Refresh and try again.');
        });
    })->create();
