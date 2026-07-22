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
        Schema::create('rol_permiso', function (Blueprint $table) {
            $table->id();

            $table->foreignId('rol_id')
                ->constrained('roles')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreignId('permiso_id')
                ->constrained('permisos')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->timestampsTz();

            $table->unique(
                ['rol_id', 'permiso_id'],
                'rol_permiso_rol_id_permiso_id_unique'
            );
        });

        // Comentario de la tabla
        DB::statement("
            COMMENT ON TABLE rol_permiso
            IS 'Relación entre los roles y los permisos asignados en el sistema';
        ");

        // Comentarios de las columnas
        DB::statement("
            COMMENT ON COLUMN rol_permiso.id
            IS 'Identificador único de la asignación entre rol y permiso';
        ");

        DB::statement("
            COMMENT ON COLUMN rol_permiso.rol_id
            IS 'Identificador del rol al que se asigna el permiso';
        ");

        DB::statement("
            COMMENT ON COLUMN rol_permiso.permiso_id
            IS 'Identificador del permiso asignado al rol';
        ");

        DB::statement("
            COMMENT ON COLUMN rol_permiso.created_at
            IS 'Fecha y hora de creación del registro';
        ");

        DB::statement("
            COMMENT ON COLUMN rol_permiso.updated_at
            IS 'Fecha y hora de la última actualización del registro';
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('rol_permiso');
    }
};