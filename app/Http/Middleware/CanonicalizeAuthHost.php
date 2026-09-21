<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CanonicalizeAuthHost
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! app()->environment('local') || ! $request->isMethodSafe()) {
            return $next($request);
        }

        if (! $this->isCanonicalizableAuthPath($request)) {
            return $next($request);
        }

        $appUrl = (string) config('app.url');
        $host = parse_url($appUrl, PHP_URL_HOST);
        $scheme = parse_url($appUrl, PHP_URL_SCHEME) ?: 'http';
        $port = parse_url($appUrl, PHP_URL_PORT);

        if (! is_string($host) || $host === '') {
            return $next($request);
        }

        $requestPort = $request->getPort();
        $hostMatches = $request->getHost() === $host;
        $portMatches = $port === null || (int) $requestPort === (int) $port;
        $schemeMatches = $request->getScheme() === $scheme;

        if ($hostMatches && $portMatches && $schemeMatches) {
            return $next($request);
        }

        $authority = $host;
        if ($port !== null) {
            $authority .= ':'.$port;
        }

        return redirect()->away(
            "{$scheme}://{$authority}{$request->getRequestUri()}",
            302
        );
    }

    protected function isCanonicalizableAuthPath(Request $request): bool
    {
        return $request->is('login')
            || $request->is('register')
            || $request->is('student/login')
            || $request->is('join');
    }
}
