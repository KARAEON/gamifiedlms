<x-guest-layout title="404 Not Found">
    <div class="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
        <div class="panel w-full p-8 text-center">
            <p class="text-sm font-semibold uppercase tracking-wider text-brand-600">404</p>
            <h1 class="mt-2 text-3xl font-semibold text-slate-900">Page not found</h1>
            <p class="mt-3 text-sm text-slate-600">The page you requested could not be found.</p>
            <a href="{{ route('landing') }}" class="btn-primary mt-6">Back to Home</a>
        </div>
    </div>
</x-guest-layout>

