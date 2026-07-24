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
        /*
         * Necesaria para combinar igualdad sobre sala_id
         * con rangos de tiempo en la restricción EXCLUDE.
         */
        DB::statement('CREATE EXTENSION IF NOT EXISTS btree_gist');

        Schema::create('funciones', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pelicula_id');
            $table->foreignId('sala_id');
            $table->foreignId('formato_id');

            $table->timestampTz('inicia_en');
            $table->timestampTz('finaliza_en');

            $table->decimal('precio_base', 10, 2);

            $table->string('estado', 20)
                ->default('PROGRAMADA');

            $table->timestampsTz();

            /*
             * Índices para consultas frecuentes.
             */
            $table->index('pelicula_id');
            $table->index('sala_id');
            $table->index('formato_id');
            $table->index('inicia_en');
            $table->index('estado');

            /*
             * Claves foráneas.
             */
            $table->foreign('pelicula_id')
                ->references('id')
                ->on('peliculas')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreign('sala_id')
                ->references('id')
                ->on('salas')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreign('formato_id')
                ->references('id')
                ->on('formatos')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });

        /*
         * Restricciones CHECK.
         */
        DB::statement("
            ALTER TABLE funciones
            ADD CONSTRAINT funciones_estado_check
            CHECK (
                estado IN (
                    'PROGRAMADA',
                    'ACTIVA',
                    'FINALIZADA',
                    'CANCELADA'
                )
            )
        ");

        DB::statement("
            ALTER TABLE funciones
            ADD CONSTRAINT funciones_precio_base_check
            CHECK (precio_base >= 0)
        ");

        DB::statement("
            ALTER TABLE funciones
            ADD CONSTRAINT funciones_intervalo_check
            CHECK (finaliza_en > inicia_en)
        ");

        /*
         * Impide que dos funciones programadas o activas
         * se superpongan dentro de la misma sala.
         *
         * El rango [) incluye el inicio, pero excluye el final.
         * Esto permite que una función comience exactamente
         * cuando termina la anterior.
         */
        DB::statement("
            ALTER TABLE funciones
            ADD CONSTRAINT funciones_sala_horario_excl
            EXCLUDE USING gist (
                sala_id WITH =,
                tstzrange(inicia_en, finaliza_en, '[)') WITH &&
            )
            WHERE (estado IN ('PROGRAMADA', 'ACTIVA'))
        ");

        /*
         * Comentarios de PostgreSQL.
         */
        DB::statement("
            COMMENT ON TABLE funciones IS
            'Funciones cinematográficas programadas para una película, sala y formato.'
        ");

        DB::statement("
            COMMENT ON COLUMN funciones.id IS
            'Identificador único de la función.'
        ");

        DB::statement("
            COMMENT ON COLUMN funciones.pelicula_id IS
            'Película que será proyectada en la función.'
        ");

        DB::statement("
            COMMENT ON COLUMN funciones.sala_id IS
            'Sala en la que se realizará la función.'
        ");

        DB::statement("
            COMMENT ON COLUMN funciones.formato_id IS
            'Formato de proyección utilizado en la función.'
        ");

        DB::statement("
            COMMENT ON COLUMN funciones.inicia_en IS
            'Fecha y hora de inicio de la función, incluyendo zona horaria.'
        ");

        DB::statement("
            COMMENT ON COLUMN funciones.finaliza_en IS
            'Fecha y hora de finalización, incluyendo el tiempo de limpieza y preparación.'
        ");

        DB::statement("
            COMMENT ON COLUMN funciones.precio_base IS
            'Precio base de cada entrada para la función.'
        ");

        DB::statement("
            COMMENT ON COLUMN funciones.estado IS
            'Estado de la función: PROGRAMADA, ACTIVA, FINALIZADA o CANCELADA.'
        ");

        DB::statement("
            COMMENT ON COLUMN funciones.created_at IS
            'Fecha y hora de creación del registro.'
        ");

        DB::statement("
            COMMENT ON COLUMN funciones.updated_at IS
            'Fecha y hora de última actualización del registro.'
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('funciones');
    }
};