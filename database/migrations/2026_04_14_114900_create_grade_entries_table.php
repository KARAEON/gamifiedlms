<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->string('subject');
            $table->unsignedTinyInteger('quarter');
            $table->decimal('performance_task_score', 8, 2)->nullable();
            $table->decimal('performance_task_hps', 8, 2)->nullable();
            $table->decimal('quarterly_assessment_score', 8, 2)->nullable();
            $table->decimal('quarterly_assessment_hps', 8, 2)->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['student_id', 'section_id', 'subject', 'quarter'], 'grade_entries_unique_scope');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_entries');
    }
};