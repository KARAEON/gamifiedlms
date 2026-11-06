<?php

use App\Enums\ActivityPhase;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_banks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('topic_id')->constrained()->cascadeOnDelete();
            $table->string('phase');
            $table->unsignedInteger('questions_per_attempt')->default(10);
            $table->timestamps();
            $table->unique(['topic_id', 'phase']);
        });

        Schema::table('questions', function (Blueprint $table) {
            $table->foreignId('question_bank_id')->nullable()->after('activity_id')->constrained()->cascadeOnDelete();
            $table->foreignId('activity_id')->nullable()->change();
        });

        Schema::table('attempts', function (Blueprint $table) {
            $table->json('question_ids')->nullable()->after('activity_id');
        });

        $phases = [ActivityPhase::FORMATIVE->value, ActivityPhase::SUMMATIVE->value];
        foreach (DB::table('activities')->whereIn('instructional_phase', $phases)->get() as $activity) {
            $bankId = DB::table('question_banks')->where('topic_id', $activity->topic_id)->where('phase', $activity->instructional_phase)->value('id');
            if (! $bankId) {
                $bankId = DB::table('question_banks')->insertGetId([
                    'topic_id' => $activity->topic_id,
                    'phase' => $activity->instructional_phase,
                    'questions_per_attempt' => 10,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            DB::table('questions')->where('activity_id', $activity->id)->update(['question_bank_id' => $bankId]);
        }

        foreach (DB::table('question_banks')->get() as $bank) {
            $count = DB::table('questions')->where('question_bank_id', $bank->id)->count();
            if ($count < 50 || $count > 100) {
                DB::table('activities')->where('topic_id', $bank->topic_id)->where('instructional_phase', $bank->phase)->update(['is_active' => false]);
            }
        }
    }

    public function down(): void
    {
        foreach (DB::table('question_banks')->get() as $bank) {
            $activityId = DB::table('activities')->where('topic_id', $bank->topic_id)->where('instructional_phase', $bank->phase)->value('id');
            if ($activityId) {
                DB::table('questions')->where('question_bank_id', $bank->id)->whereNull('activity_id')->update(['activity_id' => $activityId]);
            }
        }
        Schema::table('attempts', fn (Blueprint $table) => $table->dropColumn('question_ids'));
        Schema::table('questions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('question_bank_id');
            $table->foreignId('activity_id')->nullable(false)->change();
        });
        Schema::dropIfExists('question_banks');
    }
};
