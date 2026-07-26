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
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id();

            $table->foreignId('rol_id')
                ->constrained('roles')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->string('correo', 150)->unique();
            $table->string('password');

            $table->string('telefono', 20)->nullable();
            $table->string('nit', 20)->nullable();
            $table->string('direccion', 255)->nullable();

            $table->timestampTz('correo_verificado_en')->nullable();

            $table->string('estado', 20)->default('ACTIVO');

            $table->timestampTz('ultimo_acceso_en')->nullable();

            $table->rememberToken();
            $table->timestampsTz();
            $table->softDeletesTz();
        });

        DB::statement("
            ALTER TABLE usuarios
            ADD CONSTRAINT usuarios_estado_check
            CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO'))
        ");

        DB::statement("
            COMMENT ON TABLE usuarios IS
            'Usuarios registrados en la plataforma Atlantic Cinema'
        ");

        DB::statement("
            COMMENT ON COLUMN usuarios.rol_id IS
            'Rol asignado al usuario para el control de acceso'
        ");

        DB::statement("
            COMMENT ON COLUMN usuarios.correo IS
            'Correo electrónico único utilizado para iniciar sesión'
        ");

        DB::statement("
            COMMENT ON COLUMN usuarios.password IS
            'Contraseña del usuario almacenada mediante hash seguro'
        ");

        DB::statement("
            COMMENT ON COLUMN usuarios.correo_verificado_en IS
            'Fecha y hora en que fue verificado el correo electrónico'
        ");

        DB::statement("
            COMMENT ON COLUMN usuarios.estado IS
            'Estado del usuario: ACTIVO, INACTIVO o BLOQUEADO'
        ");

        DB::statement("
            COMMENT ON COLUMN usuarios.ultimo_acceso_en IS
            'Fecha y hora del último acceso exitoso del usuario'
        ");

        DB::statement("
            COMMENT ON COLUMN usuarios.deleted_at IS
            'Fecha de eliminación lógica del usuario'
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};