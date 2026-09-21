<?php

use App\Services\DemoDataPurgeService;
use Illuminate\Foundation\Inspiring;
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
