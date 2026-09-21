<?php

use App\Enums\ActivityPhase;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->enum('instructional_phase', array_column(ActivityPhase::cases(), 'value'))
                ->default(ActivityPhase::GAMIFIED->value)
                ->after('activity_type');
            $table->index(['topic_id', 'instructional_phase']);
        });
    }

    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->dropIndex(['topic_id', 'instructional_phase']);
            $table->dropColumn('instructional_phase');
        });
    }
};
