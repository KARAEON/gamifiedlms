<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mastery_cycles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('section_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lesson_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('topic_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('class_size')->default(0);
            $table->unsignedInteger('students_mastered')->default(0);
            $table->decimal('class_attainment', 5, 2)->default(0);
            $table->decimal('mastery_threshold', 5, 2)->default(75);
            $table->decimal('attainment_threshold', 5, 2)->default(80);
            $table->enum('decision', ['proceed', 'reteach'])->default('reteach');
            $table->boolean('requires_reteach')->default(true);
            $table->unsignedTinyInteger('reteach_attempts')->default(0);
            $table->string('reteach_strategy')->nullable();
            $table->text('reteach_notes')->nullable();
            $table->timestamp('reteach_completed_at')->nullable();
            $table->unsignedInteger('weekly_summative_attempts')->default(0);
            $table->decimal('weekly_summative_mps', 5, 2)->nullable();
            $table->timestamp('evaluated_at');
            $table->timestamps();

            $table->index(['section_id', 'topic_id', 'evaluated_at'], 'mastery_cycles_scope_idx');
            $table->index(['decision', 'requires_reteach'], 'mastery_cycles_decision_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mastery_cycles');
    }
};
