<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grading_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('scope', ['global', 'section'])->default('global');
            $table->foreignId('section_id')->nullable()->constrained()->nullOnDelete();
            $table->string('subject')->nullable();
            $table->date('effective_from')->nullable();
            $table->date('effective_to')->nullable();
            $table->decimal('mastery_threshold', 5, 2)->default(75);
            $table->decimal('attainment_threshold', 5, 2)->default(80);
            $table->unsignedTinyInteger('gamified_weight')->default(20);
            $table->unsignedTinyInteger('formative_weight')->default(40);
            $table->unsignedTinyInteger('summative_weight')->default(40);
            $table->boolean('weekly_summative_required')->default(true);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['scope', 'is_active'], 'grading_policies_scope_active_idx');
            $table->index(['section_id', 'subject'], 'grading_policies_section_subject_idx');
            $table->index(['effective_from', 'effective_to'], 'grading_policies_effective_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grading_policies');
    }
};
