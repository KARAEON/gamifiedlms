<?php

use App\Enums\ActivityType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('topic_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->enum('activity_type', array_column(ActivityType::cases(), 'value'));
            $table->text('instructions')->nullable();
            $table->json('settings')->nullable();
            $table->unsignedInteger('max_score')->default(100);
            $table->boolean('allow_retry')->default(true);
            $table->unsignedInteger('time_limit_seconds')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};

