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
        Schema::create('ventas', function (Blueprint $table) {
            $table->id();

            $table->string('numero_venta', 20)->unique();

            $table->foreignId('cliente_id')
                ->nullable()
                ->constrained('usuarios')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('empleado_id')
                ->nullable()
                ->constrained('usuarios')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('reserva_id')
                ->nullable()
                ->unique()
                ->constrained('reservas')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('funcion_id')
                ->constrained('funciones')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('origen', 20);

            $table->decimal('subtotal', 12, 2);
            $table->decimal('descuento', 12, 2)->default(0);
            $table->decimal('total', 12, 2);

            $table->string('estado', 30);

            $table->timestampTz('realizada_en');
            $table->timestampTz('pagada_en')->nullable();
            $table->timestampTz('cancelada_en')->nullable();

            $table->text('motivo_cancelacion')->nullable();

            $table->timestampsTz();

            $table->index('cliente_id');
            $table->index('empleado_id');
            $table->index('funcion_id');
            $table->index('estado');
            $table->index('realizada_en');
        });

        DB::statement("
            ALTER TABLE ventas
            ADD CONSTRAINT ventas_origen_check
            CHECK (
                origen IN (
                    'COMPRA_WEB',
                    'TAQUILLA',
                    'RESERVA'
                )
            )
        ");

        DB::statement("
            ALTER TABLE ventas
            ADD CONSTRAINT ventas_estado_check
            CHECK (
                estado IN (
                    'PENDIENTE',
                    'PAGADA',
                    'FALLIDA',
                    'CANCELADA',
                    'REEMBOLSADA',
                    'PARCIALMENTE_REEMBOLSADA'
                )
            )
        ");

        DB::statement("
            ALTER TABLE ventas
            ADD CONSTRAINT ventas_subtotal_check
            CHECK (subtotal >= 0)
        ");

        DB::statement("
            ALTER TABLE ventas
            ADD CONSTRAINT ventas_descuento_check
            CHECK (descuento >= 0 AND descuento <= subtotal)
        ");

        DB::statement("
            ALTER TABLE ventas
            ADD CONSTRAINT ventas_total_check
            CHECK (total >= 0 AND total = subtotal - descuento)
        ");

        DB::statement("
            ALTER TABLE ventas
            ADD CONSTRAINT ventas_cliente_empleado_check
            CHECK (
                cliente_id IS NOT NULL
                OR empleado_id IS NOT NULL
            )
        ");

        DB::statement("
            ALTER TABLE ventas
            ADD CONSTRAINT ventas_origen_reserva_check
            CHECK (
                (origen = 'RESERVA' AND reserva_id IS NOT NULL)
                OR
                (origen IN ('COMPRA_WEB', 'TAQUILLA') AND reserva_id IS NULL)
            )
        ");

        DB::statement("
            COMMENT ON TABLE ventas IS
            'Ventas de entradas realizadas por clientes o empleados para una función'
        ");

        DB::statement("
            COMMENT ON COLUMN ventas.numero_venta IS
            'Código único utilizado para identificar la venta'
        ");

        DB::statement("
            COMMENT ON COLUMN ventas.cliente_id IS
            'Cliente asociado con la compra, cuando corresponda'
        ");

        DB::statement("
            COMMENT ON COLUMN ventas.empleado_id IS
            'Empleado que registra la venta en taquilla, cuando corresponda'
        ");

        DB::statement("
            COMMENT ON COLUMN ventas.reserva_id IS
            'Reserva convertida en venta, cuando la operación se origina desde una reserva'
        ");

        DB::statement("
            COMMENT ON COLUMN ventas.funcion_id IS
            'Función de cine a la que pertenecen todas las entradas de la venta'
        ");

        DB::statement("
            COMMENT ON COLUMN ventas.origen IS
            'Origen de la operación: COMPRA_WEB, TAQUILLA o RESERVA'
        ");

        DB::statement("
            COMMENT ON COLUMN ventas.subtotal IS
            'Suma de los precios de las entradas antes de descuentos'
        ");

        DB::statement("
            COMMENT ON COLUMN ventas.descuento IS
            'Descuento monetario aplicado a la venta'
        ");

        DB::statement("
            COMMENT ON COLUMN ventas.total IS
            'Monto final de la venta después de aplicar el descuento'
        ");

        DB::statement("
            COMMENT ON COLUMN ventas.estado IS
            'Estado actual de la venta'
        ");

        DB::statement("
            COMMENT ON COLUMN ventas.realizada_en IS
            'Fecha y hora en que se registró la venta'
        ");

        DB::statement("
            COMMENT ON COLUMN ventas.pagada_en IS
            'Fecha y hora en que se confirmó el pago'
        ");

        DB::statement("
            COMMENT ON COLUMN ventas.cancelada_en IS
            'Fecha y hora en que se canceló la venta'
        ");

        DB::statement("
            COMMENT ON COLUMN ventas.motivo_cancelacion IS
            'Descripción del motivo por el que se canceló la venta'
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('ventas');
    }
};