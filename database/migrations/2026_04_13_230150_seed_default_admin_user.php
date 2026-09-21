<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            $this->rebuildSqliteUsersTable("('student','teacher','admin')");
        }

        $email = 'admin@glms.test';
        $exists = DB::table('users')->where('email', $email)->exists();

        if (! $exists) {
            DB::table('users')->insert([
                'name' => 'School Head',
                'email' => $email,
                'role' => 'admin',
                'is_active' => true,
                'password' => Hash::make('password123'),
                'remember_token' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('users')->where('email', 'admin@glms.test')->delete();

        if (DB::getDriverName() === 'sqlite') {
            $this->rebuildSqliteUsersTable("('student','teacher')");
        }
    }

    protected function rebuildSqliteUsersTable(string $roleSet): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        DB::statement("
            CREATE TABLE users_tmp (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                name VARCHAR NOT NULL,
                email VARCHAR NOT NULL,
                email_verified_at DATETIME NULL,
                role VARCHAR NOT NULL CHECK (role IN {$roleSet}),
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                password VARCHAR NOT NULL,
                remember_token VARCHAR NULL,
                created_at DATETIME NULL,
                updated_at DATETIME NULL,
                UNIQUE (email)
            )
        ");

        DB::statement('
            INSERT INTO users_tmp (id, name, email, email_verified_at, role, is_active, password, remember_token, created_at, updated_at)
            SELECT id, name, email, email_verified_at, role, is_active, password, remember_token, created_at, updated_at
            FROM users
        ');

        DB::statement('DROP TABLE users');
        DB::statement('ALTER TABLE users_tmp RENAME TO users');
        DB::statement('CREATE INDEX users_role_index ON users(role)');
        DB::statement('PRAGMA foreign_keys = ON');
    }
};
