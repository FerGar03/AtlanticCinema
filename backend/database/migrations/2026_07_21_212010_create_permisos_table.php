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
        Schema::create('permisos', function (Blueprint $table) {
            $table->id();

            $table->string('nombre', 100)->unique();
            $table->text('descripcion')->nullable();
            $table->string('estado', 20)->default('ACTIVO');

            $table->timestampsTz();
        });

        DB::statement("
            ALTER TABLE permisos
            ADD CONSTRAINT permisos_estado_check
            CHECK (estado IN ('ACTIVO', 'INACTIVO'))
        ");
        DB::statement("
    COMMENT ON TABLE permisos
    IS 'Catálogo de permisos disponibles en el sistema';
");

DB::statement("
    COMMENT ON COLUMN permisos.id
    IS 'Identificador único del permiso';
");

DB::statement("
    COMMENT ON COLUMN permisos.nombre
    IS 'Nombre único del permiso dentro del sistema';
");

DB::statement("
    COMMENT ON COLUMN permisos.descripcion
    IS 'Descripción funcional del permiso';
");

DB::statement("
    COMMENT ON COLUMN permisos.estado
    IS 'Estado del permiso (ACTIVO o INACTIVO)';
");

DB::statement("
    COMMENT ON COLUMN permisos.created_at
    IS 'Fecha y hora de creación del registro';
");

DB::statement("
    COMMENT ON COLUMN permisos.updated_at
    IS 'Fecha y hora de la última actualización del registro';
");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('permisos');
    }
};