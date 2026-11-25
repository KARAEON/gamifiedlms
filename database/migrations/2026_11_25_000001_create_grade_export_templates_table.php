<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_export_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('teacher_id')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('sheet_name', 31);
            $table->string('heading');
            $table->string('accent_color', 7)->default('#1e40af');
            $table->json('columns');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_export_templates');
    }
};
