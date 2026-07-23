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
        // Crear tabla
        Schema::create('pelicula_genero', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pelicula_id')
                ->constrained('peliculas')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreignId('genero_id')
                ->constrained('generos')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->timestampsTz();

            $table->unique(
                ['pelicula_id', 'genero_id'],
                'pelicula_genero_pelicula_id_genero_id_unique'
            );
        });

        // Comentario de la tabla
        DB::statement("
            COMMENT ON TABLE pelicula_genero
            IS 'Relación entre las películas y sus géneros cinematográficos';
        ");

        // Comentarios de las columnas
        DB::statement("
            COMMENT ON COLUMN pelicula_genero.id
            IS 'Identificador único de la asignación entre película y género';
        ");

        DB::statement("
            COMMENT ON COLUMN pelicula_genero.pelicula_id
            IS 'Identificador de la película asociada';
        ");

        DB::statement("
            COMMENT ON COLUMN pelicula_genero.genero_id
            IS 'Identificador del género asignado a la película';
        ");

        DB::statement("
            COMMENT ON COLUMN pelicula_genero.created_at
            IS 'Fecha y hora de creación del registro';
        ");

        DB::statement("
            COMMENT ON COLUMN pelicula_genero.updated_at
            IS 'Fecha y hora de la última actualización del registro';
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('pelicula_genero');
    }
};