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
        Schema::create('clasificaciones', function (Blueprint $table) {
            $table->id();

            $table->string('nombre', 50)->unique();
            $table->text('descripcion')->nullable();
            $table->unsignedTinyInteger('edad_minima');
            $table->string('color', 20)->nullable();
            $table->string('estado', 20)->default('ACTIVO');

            $table->timestampsTz();
        });

        DB::statement("
            ALTER TABLE clasificaciones
            ADD CONSTRAINT clasificaciones_estado_check
            CHECK (estado IN ('ACTIVO', 'INACTIVO'))
        ");

        DB::statement("
            COMMENT ON TABLE clasificaciones
            IS 'Catálogo de clasificaciones de películas';
        ");

        DB::statement("
            COMMENT ON COLUMN clasificaciones.id
            IS 'Identificador único de la clasificación';
        ");

        DB::statement("
            COMMENT ON COLUMN clasificaciones.nombre
            IS 'Nombre de la clasificación';
        ");

        DB::statement("
            COMMENT ON COLUMN clasificaciones.descripcion
            IS 'Descripción de la clasificación';
        ");

        DB::statement("
            COMMENT ON COLUMN clasificaciones.edad_minima
            IS 'Edad mínima recomendada';
        ");

        DB::statement("
            COMMENT ON COLUMN clasificaciones.color
            IS 'Color utilizado para representar la clasificación';
        ");

        DB::statement("
            COMMENT ON COLUMN clasificaciones.estado
            IS 'Estado de la clasificación';
        ");

        DB::statement("
            COMMENT ON COLUMN clasificaciones.created_at
            IS 'Fecha de creación';
        ");

        DB::statement("
            COMMENT ON COLUMN clasificaciones.updated_at
            IS 'Fecha de actualización';
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('clasificaciones');
    }
};