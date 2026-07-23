<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('salas', function (Blueprint $table) {
            $table->id();

            $table->string('nombre', 100)->unique();
            $table->smallInteger('capacidad');
            $table->text('descripcion')->nullable();

            $table->string('estado', 20)
                ->default('ACTIVA');

            $table->timestampsTz();
            $table->softDeletesTz();
        });

        DB::statement("
            ALTER TABLE salas
            ADD CONSTRAINT chk_salas_capacidad
            CHECK (capacidad > 0);
        ");

        DB::statement("
            ALTER TABLE salas
            ADD CONSTRAINT chk_salas_estado
            CHECK (estado IN (
                'ACTIVA',
                'INACTIVA',
                'MANTENIMIENTO'
            ));
        ");

        DB::statement("
            COMMENT ON TABLE salas IS
            'Salas de proyección del cine.';
        ");

        DB::statement("
            COMMENT ON COLUMN salas.id IS
            'Identificador único de la sala.';
        ");

        DB::statement("
            COMMENT ON COLUMN salas.nombre IS
            'Nombre de la sala.';
        ");

        DB::statement("
            COMMENT ON COLUMN salas.capacidad IS
            'Cantidad máxima de asientos activos.';
        ");

        DB::statement("
            COMMENT ON COLUMN salas.descripcion IS
            'Descripción opcional de la sala.';
        ");

        DB::statement("
            COMMENT ON COLUMN salas.estado IS
            'Estado operativo de la sala.';
        ");

        DB::statement("
            COMMENT ON COLUMN salas.created_at IS
            'Fecha de creación.';
        ");

        DB::statement("
            COMMENT ON COLUMN salas.updated_at IS
            'Fecha de última actualización.';
        ");

        DB::statement("
            COMMENT ON COLUMN salas.deleted_at IS
            'Fecha de eliminación lógica.';
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salas');
    }
};