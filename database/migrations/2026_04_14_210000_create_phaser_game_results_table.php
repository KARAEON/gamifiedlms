<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('phaser_game_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('section_id')->nullable()->constrained()->nullOnDelete();
            $table->string('lesson_key', 40);
            $table->string('lesson_title');
            $table->string('game_key', 80);
            $table->string('entry_type', 20);
            $table->string('phase', 20);
            $table->string('game_title');
            $table->string('topic_title');
            $table->uuid('submission_uuid')->unique();
            $table->unsignedInteger('attempt_number')->default(1);
            $table->decimal('score', 8, 2)->default(0);
            $table->decimal('max_score', 8, 2)->default(0);
            $table->decimal('accuracy', 5, 2)->default(0);
            $table->string('result_status', 30)->default('completed');
            $table->json('payload')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'completed_at']);
            $table->index(['section_id', 'lesson_key']);
            $table->index(['entry_type', 'phase']);
            $table->index(['student_id', 'entry_type', 'lesson_key', 'game_key'], 'phaser_result_attempt_lookup');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('phaser_game_results');
    }
};
