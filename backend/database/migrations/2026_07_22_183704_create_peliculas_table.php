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
        Schema::create('peliculas', function (Blueprint $table) {
            $table->id();

            $table->foreignId('clasificacion_id')
                ->constrained('clasificaciones')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('titulo', 255);
            $table->string('titulo_original', 255)->nullable();
            $table->text('sinopsis');
            $table->unsignedSmallInteger('duracion_minutos');
            $table->date('fecha_estreno')->nullable();
            $table->string('imagen_url', 500);
            $table->string('trailer_url', 500)->nullable();
            $table->string('estado', 20)->default('ACTIVA');

            $table->timestampsTz();
            $table->softDeletesTz();

            $table->index('titulo', 'peliculas_titulo_index');
            $table->index('estado', 'peliculas_estado_index');
        });

        // Restricciones
        DB::statement("
            ALTER TABLE peliculas
            ADD CONSTRAINT peliculas_duracion_minutos_check
            CHECK (duracion_minutos > 0)
        ");

        DB::statement("
            ALTER TABLE peliculas
            ADD CONSTRAINT peliculas_estado_check
            CHECK (estado IN ('ACTIVA', 'INACTIVA'))
        ");

        // Comentario de la tabla
        DB::statement("
            COMMENT ON TABLE peliculas
            IS 'Registro de películas administradas por Atlantic Cinema';
        ");

        // Comentarios de las columnas
        DB::statement("
            COMMENT ON COLUMN peliculas.id
            IS 'Identificador único de la película';
        ");

        DB::statement("
            COMMENT ON COLUMN peliculas.clasificacion_id
            IS 'Identificador de la clasificación asignada a la película';
        ");

        DB::statement("
            COMMENT ON COLUMN peliculas.titulo
            IS 'Título utilizado para mostrar la película en la plataforma';
        ");

        DB::statement("
            COMMENT ON COLUMN peliculas.titulo_original
            IS 'Título original de la película';
        ");

        DB::statement("
            COMMENT ON COLUMN peliculas.sinopsis
            IS 'Resumen descriptivo del argumento de la película';
        ");

        DB::statement("
            COMMENT ON COLUMN peliculas.duracion_minutos
            IS 'Duración total de la película expresada en minutos';
        ");

        DB::statement("
            COMMENT ON COLUMN peliculas.fecha_estreno
            IS 'Fecha de estreno de la película';
        ");

        DB::statement("
            COMMENT ON COLUMN peliculas.imagen_url
            IS 'Dirección de la imagen utilizada en la cartelera';
        ");

        DB::statement("
            COMMENT ON COLUMN peliculas.trailer_url
            IS 'Dirección del tráiler oficial de la película';
        ");

        DB::statement("
            COMMENT ON COLUMN peliculas.estado
            IS 'Estado de la película (ACTIVA o INACTIVA)';
        ");

        DB::statement("
            COMMENT ON COLUMN peliculas.created_at
            IS 'Fecha y hora de creación del registro';
        ");

        DB::statement("
            COMMENT ON COLUMN peliculas.updated_at
            IS 'Fecha y hora de la última actualización del registro';
        ");

        DB::statement("
            COMMENT ON COLUMN peliculas.deleted_at
            IS 'Fecha y hora de eliminación lógica de la película';
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('peliculas');
    }
};