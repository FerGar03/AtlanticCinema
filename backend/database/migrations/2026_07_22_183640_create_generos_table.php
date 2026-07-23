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
        Schema::create('generos', function (Blueprint $table) {
            $table->id();

            $table->string('nombre', 100)->unique();
            $table->text('descripcion')->nullable();
            $table->string('estado', 20)->default('ACTIVO');

            $table->timestampsTz();
        });

        DB::statement("
            ALTER TABLE generos
            ADD CONSTRAINT generos_estado_check
            CHECK (estado IN ('ACTIVO', 'INACTIVO'))
        ");

        DB::statement("
            COMMENT ON TABLE generos
            IS 'Catálogo de géneros cinematográficos';
        ");

        DB::statement("
            COMMENT ON COLUMN generos.id
            IS 'Identificador único del género';
        ");

        DB::statement("
            COMMENT ON COLUMN generos.nombre
            IS 'Nombre del género';
        ");

        DB::statement("
            COMMENT ON COLUMN generos.descripcion
            IS 'Descripción del género';
        ");

        DB::statement("
            COMMENT ON COLUMN generos.estado
            IS 'Estado del género';
        ");

        DB::statement("
            COMMENT ON COLUMN generos.created_at
            IS 'Fecha de creación';
        ");

        DB::statement("
            COMMENT ON COLUMN generos.updated_at
            IS 'Fecha de actualización';
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('generos');
    }
};