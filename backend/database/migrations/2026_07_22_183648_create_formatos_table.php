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
        Schema::create('formatos', function (Blueprint $table) {
            $table->id();

            $table->string('nombre', 50)->unique();
            $table->text('descripcion')->nullable();
            $table->string('estado', 20)->default('ACTIVO');

            $table->timestampsTz();
        });

        DB::statement("
            ALTER TABLE formatos
            ADD CONSTRAINT formatos_estado_check
            CHECK (estado IN ('ACTIVO', 'INACTIVO'))
        ");

        DB::statement("
            COMMENT ON TABLE formatos
            IS 'Catálogo de formatos de proyección';
        ");

        DB::statement("
            COMMENT ON COLUMN formatos.id
            IS 'Identificador único del formato';
        ");

        DB::statement("
            COMMENT ON COLUMN formatos.nombre
            IS 'Nombre del formato';
        ");

        DB::statement("
            COMMENT ON COLUMN formatos.descripcion
            IS 'Descripción del formato';
        ");

        DB::statement("
            COMMENT ON COLUMN formatos.estado
            IS 'Estado del formato';
        ");

        DB::statement("
            COMMENT ON COLUMN formatos.created_at
            IS 'Fecha de creación';
        ");

        DB::statement("
            COMMENT ON COLUMN formatos.updated_at
            IS 'Fecha de actualización';
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('formatos');
    }
};
