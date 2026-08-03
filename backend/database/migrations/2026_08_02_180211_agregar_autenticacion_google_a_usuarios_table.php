<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table): void {
            $table->string('google_id', 255)
                ->nullable()
                ->unique()
                ->after('correo');

            $table->string('avatar_url', 500)
                ->nullable()
                ->after('google_id');

            $table->string('password')
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table): void {
            $table->dropUnique(['google_id']);
            $table->dropColumn([
                'google_id',
                'avatar_url',
            ]);

            $table->string('password')
                ->nullable(false)
                ->change();
        });
    }
};