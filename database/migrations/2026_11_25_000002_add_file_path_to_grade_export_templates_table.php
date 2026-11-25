<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grade_export_templates', fn (Blueprint $table) => $table->string('file_path')->nullable());
    }

    public function down(): void
    {
        Schema::table('grade_export_templates', fn (Blueprint $table) => $table->dropColumn('file_path'));
    }
};
