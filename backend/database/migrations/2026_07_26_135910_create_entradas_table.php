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
        Schema::create('entradas', function (Blueprint $table) {
            $table->id();

            $table->foreignId('venta_id')
                ->constrained('ventas')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('funcion_asiento_id')
                ->constrained('funcion_asientos')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('codigo', 30)->unique();

            $table->decimal('precio', 12, 2);

            $table->string('estado', 20);

            $table->timestampTz('emitida_en');
            $table->timestampTz('utilizada_en')->nullable();
            $table->timestampTz('cancelada_en')->nullable();
            $table->timestampTz('reembolsada_en')->nullable();

            $table->timestampsTz();

            $table->index('venta_id');
            $table->index('funcion_asiento_id');
            $table->index('estado');
            $table->index('emitida_en');
        });

        DB::statement("
            ALTER TABLE entradas
            ADD CONSTRAINT entradas_estado_check
            CHECK (
                estado IN (
                    'PENDIENTE',
                    'VALIDA',
                    'UTILIZADA',
                    'CANCELADA',
                    'REEMBOLSADA'
                )
            )
        ");

        DB::statement("
            ALTER TABLE entradas
            ADD CONSTRAINT entradas_precio_check
            CHECK (precio >= 0)
        ");

        DB::statement("
            CREATE UNIQUE INDEX entradas_funcion_asiento_activa_unique
            ON entradas (funcion_asiento_id)
            WHERE estado IN ('PENDIENTE', 'VALIDA', 'UTILIZADA')
        ");

        DB::statement("
            COMMENT ON TABLE entradas IS
            'Entradas individuales generadas como resultado de una venta'
        ");

        DB::statement("
            COMMENT ON COLUMN entradas.venta_id IS
            'Venta a la que pertenece la entrada'
        ");

        DB::statement("
            COMMENT ON COLUMN entradas.funcion_asiento_id IS
            'Asiento específico dentro del mapa de una función'
        ");

        DB::statement("
            COMMENT ON COLUMN entradas.codigo IS
            'Código único de identificación y validación de la entrada'
        ");

        DB::statement("
            COMMENT ON COLUMN entradas.precio IS
            'Precio individual cobrado por la entrada'
        ");

        DB::statement("
            COMMENT ON COLUMN entradas.estado IS
            'Estado actual de la entrada'
        ");

        DB::statement("
            COMMENT ON COLUMN entradas.emitida_en IS
            'Fecha y hora en que se generó la entrada'
        ");

        DB::statement("
            COMMENT ON COLUMN entradas.utilizada_en IS
            'Fecha y hora en que la entrada fue utilizada'
        ");

        DB::statement("
            COMMENT ON COLUMN entradas.cancelada_en IS
            'Fecha y hora en que se canceló la entrada'
        ");

        DB::statement("
            COMMENT ON COLUMN entradas.reembolsada_en IS
            'Fecha y hora en que se reembolsó la entrada'
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('entradas');
    }
};