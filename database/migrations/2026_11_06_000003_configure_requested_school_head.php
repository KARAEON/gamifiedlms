<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        $email = trim((string) env('GLMS_INITIAL_ADMIN_EMAIL'));
        $password = (string) env('GLMS_INITIAL_ADMIN_PASSWORD');

        if ($email === '' || strlen($password) < 8 || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            return;
        }

        $user = DB::table('users')->where('email', $email)->first()
            ?? DB::table('users')->where('email', 'admin@glms.test')->first();

        if (! $user) {
            return;
        }

        DB::table('users')->where('id', $user->id)->update([
            'name' => 'School Head',
            'email' => $email,
            'role' => 'admin',
            'is_active' => true,
            'password' => Hash::make($password),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        // Credentials are one-time deployment inputs and are not restored on rollback.
    }
};
