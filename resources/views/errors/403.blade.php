<x-guest-layout title="403 Forbidden">
    <div class="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
        <div class="panel w-full p-8 text-center">
            <p class="text-sm font-semibold uppercase tracking-wider text-rose-600">403</p>
            <h1 class="mt-2 text-3xl font-semibold text-slate-900">Access denied</h1>
            <p class="mt-3 text-sm text-slate-600">You do not have permission to view this page.</p>
            <a href="{{ route('dashboard') }}" class="btn-primary mt-6">Go to Dashboard</a>
        </div>
    </div>
</x-guest-layout>

