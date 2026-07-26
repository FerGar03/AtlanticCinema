<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metodos_pago', function (Blueprint $table) {
            $table->id();

            $table->string('codigo', 30)->unique();
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->string('estado', 20)->default('ACTIVO');

            $table->timestampsTz();
        });

        DB::statement("
            ALTER TABLE metodos_pago
            ADD CONSTRAINT metodos_pago_estado_check
            CHECK (estado IN ('ACTIVO', 'INACTIVO'))
        ");

        DB::statement("
            COMMENT ON TABLE metodos_pago IS
            'Catálogo de métodos de pago aceptados por Atlantic Cinema'
        ");

        DB::statement("
            COMMENT ON COLUMN metodos_pago.codigo IS
            'Código único del método de pago'
        ");

        DB::statement("
            COMMENT ON COLUMN metodos_pago.nombre IS
            'Nombre descriptivo del método de pago'
        ");

        DB::statement("
            COMMENT ON COLUMN metodos_pago.descripcion IS
            'Descripción opcional del método de pago'
        ");

        DB::statement("
            COMMENT ON COLUMN metodos_pago.estado IS
            'Estado administrativo del método de pago: ACTIVO o INACTIVO'
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('metodos_pago');
    }
};