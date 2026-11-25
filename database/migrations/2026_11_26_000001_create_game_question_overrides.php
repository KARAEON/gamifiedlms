<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('game_question_overrides', function (Blueprint $table) {
            $table->id();
            $table->string('lesson_key', 40);
            $table->string('item_key', 40);
            $table->json('content');
            $table->timestamps();
            $table->unique(['lesson_key', 'item_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_question_overrides');
    }
};
