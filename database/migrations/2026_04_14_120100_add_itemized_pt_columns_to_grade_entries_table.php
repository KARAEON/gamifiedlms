<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grade_entries', function (Blueprint $table): void {
            $table->json('performance_task_items')->nullable()->after('quarter');
            $table->json('performance_task_hps_items')->nullable()->after('performance_task_items');
        });
    }

    public function down(): void
    {
        Schema::table('grade_entries', function (Blueprint $table): void {
            $table->dropColumn(['performance_task_items', 'performance_task_hps_items']);
        });
    }
};