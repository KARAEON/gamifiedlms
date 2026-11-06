<?php

use App\Services\DemoDataPurgeService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('demo-data:purge', function (DemoDataPurgeService $purger) {
    $counts = $purger->purge();

    $this->info('Demo data purge complete.');
    $this->table(['Entity', 'Deleted'], collect($counts)->map(
        fn (int $count, string $entity): array => [$entity, $count]
    )->values()->all());
})->purpose('Remove the seeded demo users, sections, curriculum, reports, and scores.');

Artisan::command('admin:configure-initial', function () {
    $email = trim((string) env('GLMS_INITIAL_ADMIN_EMAIL'));
    $password = (string) env('GLMS_INITIAL_ADMIN_PASSWORD');

    if ($email === '' || strlen($password) < 8 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        $this->line('No initial admin credentials configured; skipping.');

        return self::SUCCESS;
    }

    $user = DB::table('users')->where('email', $email)->first()
        ?? DB::table('users')->where('email', 'admin@glms.test')->first();

    if (! $user) {
        $this->error('No seeded admin account was found to configure.');

        return self::FAILURE;
    }

    if ($user->email !== $email || ! Hash::check($password, $user->password) || $user->role !== 'admin' || ! $user->is_active) {
        DB::table('users')->where('id', $user->id)->update([
            'name' => 'School Head',
            'email' => $email,
            'role' => 'admin',
            'is_active' => true,
            'password' => Hash::make($password),
            'updated_at' => now(),
        ]);
    }

    $this->info('Initial school head account configured.');

    return self::SUCCESS;
})->purpose('Configure the initial school head account from temporary deployment secrets.');
