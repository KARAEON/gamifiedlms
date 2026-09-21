<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_report_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submitted_by')->constrained('users')->cascadeOnDelete();
            $table->enum('report_scope', ['subject', 'class', 'teacher', 'quarterly']);
            $table->string('scope_reference')->nullable();
            $table->date('date_from')->nullable();
            $table->date('date_to')->nullable();
            $table->string('destination')->nullable();
            $table->enum('status', ['draft', 'submitted'])->default('submitted');
            $table->timestamp('submitted_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index(['report_scope', 'submitted_at'], 'admin_report_scope_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_report_submissions');
    }
};
