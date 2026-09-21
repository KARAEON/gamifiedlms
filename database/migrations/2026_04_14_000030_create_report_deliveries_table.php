<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('submitted_by')->constrained('users')->cascadeOnDelete();
            $table->enum('target_role', ['admin'])->default('admin');
            $table->enum('status', ['submitted', 'acknowledged'])->default('submitted');
            $table->foreignId('acknowledged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at');
            $table->timestamp('acknowledged_at')->nullable();
            $table->text('teacher_note')->nullable();
            $table->text('admin_note')->nullable();
            $table->timestamps();

            $table->index(['target_role', 'status', 'submitted_at'], 'report_deliveries_queue_idx');
            $table->index(['report_id', 'status'], 'report_deliveries_report_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_deliveries');
    }
};
