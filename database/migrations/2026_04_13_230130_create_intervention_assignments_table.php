<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('intervention_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mastery_cycle_id')->nullable()->constrained('mastery_cycles')->nullOnDelete();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('topic_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->enum('intervention_type', ['remediation', 'enrichment']);
            $table->string('recommended_action');
            $table->text('reason')->nullable();
            $table->enum('status', ['assigned', 'in_progress', 'completed'])->default('assigned');
            $table->timestamp('assigned_at');
            $table->timestamp('due_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['section_id', 'topic_id', 'intervention_type'], 'interventions_scope_idx');
            $table->index(['student_id', 'status'], 'interventions_student_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('intervention_assignments');
    }
};
