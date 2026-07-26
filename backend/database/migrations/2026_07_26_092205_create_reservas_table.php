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
        Schema::create('reservas', function (Blueprint $table) {
            $table->id();

            $table->string('codigo', 20)->unique();

            $table->foreignId('usuario_id')
                ->constrained('usuarios')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('funcion_id')
                ->constrained('funciones')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->unsignedSmallInteger('cantidad_entradas');

            $table->decimal('subtotal', 12, 2);
            $table->decimal('descuento', 12, 2)->default(0);
            $table->decimal('total', 12, 2);

            $table->string('estado', 20)->default('PENDIENTE');

            $table->timestampTz('reservada_en');
            $table->timestampTz('expira_en');
            $table->timestampTz('convertida_en')->nullable();
            $table->timestampTz('cancelada_en')->nullable();

            $table->text('motivo_cancelacion')->nullable();

            $table->timestampsTz();
        });

        DB::statement("
            ALTER TABLE reservas
            ADD CONSTRAINT reservas_cantidad_entradas_check
            CHECK (cantidad_entradas > 0)
        ");

        DB::statement("
            ALTER TABLE reservas
            ADD CONSTRAINT reservas_subtotal_check
            CHECK (subtotal >= 0)
        ");

        DB::statement("
            ALTER TABLE reservas
            ADD CONSTRAINT reservas_descuento_check
            CHECK (descuento >= 0)
        ");

        DB::statement("
            ALTER TABLE reservas
            ADD CONSTRAINT reservas_total_check
            CHECK (total >= 0)
        ");

        DB::statement("
            ALTER TABLE reservas
            ADD CONSTRAINT reservas_total_calculo_check
            CHECK (total = subtotal - descuento)
        ");

        DB::statement("
            ALTER TABLE reservas
            ADD CONSTRAINT reservas_fechas_check
            CHECK (expira_en > reservada_en)
        ");

        DB::statement("
            ALTER TABLE reservas
            ADD CONSTRAINT reservas_estado_check
            CHECK (
                estado IN (
                    'PENDIENTE',
                    'VENCIDA',
                    'CANCELADA',
                    'CONVERTIDA'
                )
            )
        ");

        DB::statement("
            COMMENT ON TABLE reservas IS
            'Encabezados de las reservas de asientos realizadas para funciones'
        ");

        DB::statement("
            COMMENT ON COLUMN reservas.codigo IS
            'Código único de identificación de la reserva'
        ");

        DB::statement("
            COMMENT ON COLUMN reservas.usuario_id IS
            'Usuario cliente que realizó la reserva'
        ");

        DB::statement("
            COMMENT ON COLUMN reservas.funcion_id IS
            'Función cinematográfica asociada a la reserva'
        ");

        DB::statement("
            COMMENT ON COLUMN reservas.cantidad_entradas IS
            'Cantidad total de asientos incluidos en la reserva'
        ");

        DB::statement("
            COMMENT ON COLUMN reservas.subtotal IS
            'Suma de los precios de los asientos antes de descuentos'
        ");

        DB::statement("
            COMMENT ON COLUMN reservas.descuento IS
            'Descuento total aplicado a la reserva'
        ");

        DB::statement("
            COMMENT ON COLUMN reservas.total IS
            'Monto final de la reserva después de descuentos'
        ");

        DB::statement("
            COMMENT ON COLUMN reservas.estado IS
            'Estado de la reserva: PENDIENTE, VENCIDA, CANCELADA o CONVERTIDA'
        ");

        DB::statement("
            COMMENT ON COLUMN reservas.reservada_en IS
            'Fecha y hora en que se creó la reserva'
        ");

        DB::statement("
            COMMENT ON COLUMN reservas.expira_en IS
            'Fecha y hora límite para confirmar o convertir la reserva'
        ");

        DB::statement("
            COMMENT ON COLUMN reservas.convertida_en IS
            'Fecha y hora en que la reserva fue convertida en venta'
        ");

        DB::statement("
            COMMENT ON COLUMN reservas.cancelada_en IS
            'Fecha y hora en que la reserva fue cancelada'
        ");

        DB::statement("
            COMMENT ON COLUMN reservas.motivo_cancelacion IS
            'Descripción del motivo de cancelación de la reserva'
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservas');
    }
};