<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ejecuta la migración.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();

            $table->string('nombre', 100)->unique();
            $table->text('descripcion')->nullable();
            $table->string('estado', 20)->default('ACTIVO');

            $table->timestampsTz();
        });

        DB::statement("
            ALTER TABLE roles
            ADD CONSTRAINT roles_estado_check
            CHECK (estado IN ('ACTIVO', 'INACTIVO'))
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};