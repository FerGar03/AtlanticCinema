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
        Schema::create('factura_detalles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('factura_id')
                ->constrained('facturas')
                ->restrictOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('entrada_id')
                ->constrained('entradas')
                ->restrictOnUpdate()
                ->restrictOnDelete();

            $table->unsignedInteger('numero_linea');
            $table->string('descripcion', 255);

            $table->unsignedInteger('cantidad')->default(1);
            $table->decimal('precio_unitario', 12, 2);
            $table->decimal('descuento', 12, 2)->default(0);
            $table->decimal('subtotal', 12, 2);
            $table->decimal('monto_impuesto', 12, 2)->default(0);
            $table->decimal('total_linea', 12, 2);

            $table->timestampsTz();

            $table->unique(
                ['factura_id', 'numero_linea'],
                'factura_detalles_factura_linea_unique'
            );

            $table->unique(
                ['factura_id', 'entrada_id'],
                'factura_detalles_factura_entrada_unique'
            );
        });

        DB::statement("
            ALTER TABLE factura_detalles
            ADD CONSTRAINT factura_detalles_numero_linea_check
            CHECK (numero_linea > 0)
        ");

        DB::statement("
            ALTER TABLE factura_detalles
            ADD CONSTRAINT factura_detalles_cantidad_check
            CHECK (cantidad = 1)
        ");

        DB::statement("
            ALTER TABLE factura_detalles
            ADD CONSTRAINT factura_detalles_precio_unitario_check
            CHECK (precio_unitario > 0)
        ");

        DB::statement("
            ALTER TABLE factura_detalles
            ADD CONSTRAINT factura_detalles_descuento_check
            CHECK (descuento >= 0)
        ");

        DB::statement("
            ALTER TABLE factura_detalles
            ADD CONSTRAINT factura_detalles_subtotal_check
            CHECK (subtotal >= 0)
        ");

        DB::statement("
            ALTER TABLE factura_detalles
            ADD CONSTRAINT factura_detalles_monto_impuesto_check
            CHECK (monto_impuesto >= 0)
        ");

        DB::statement("
            ALTER TABLE factura_detalles
            ADD CONSTRAINT factura_detalles_total_linea_check
            CHECK (total_linea > 0)
        ");

        DB::statement("
            ALTER TABLE factura_detalles
            ADD CONSTRAINT factura_detalles_subtotal_calculo_check
            CHECK (subtotal = cantidad * precio_unitario)
        ");

        DB::statement("
            ALTER TABLE factura_detalles
            ADD CONSTRAINT factura_detalles_total_calculo_check
            CHECK (
                total_linea = subtotal - descuento + monto_impuesto
            )
        ");

        DB::statement("
            COMMENT ON TABLE factura_detalles IS
            'Detalle de las entradas incluidas en cada factura electrónica FEL.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_detalles.factura_id IS
            'Factura electrónica a la que pertenece la línea.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_detalles.entrada_id IS
            'Entrada de cine facturada en esta línea.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_detalles.numero_linea IS
            'Número correlativo de la línea dentro de la factura.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_detalles.descripcion IS
            'Descripción de la entrada, película, función, sala y asiento facturado.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_detalles.cantidad IS
            'Cantidad facturada. Para entradas de cine siempre será igual a uno.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_detalles.precio_unitario IS
            'Precio individual de la entrada.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_detalles.descuento IS
            'Descuento aplicado específicamente a la línea.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_detalles.subtotal IS
            'Resultado de multiplicar cantidad por precio unitario.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_detalles.monto_impuesto IS
            'Monto de impuestos asociado a la línea.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_detalles.total_linea IS
            'Total final de la línea después de descuentos e impuestos.'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('factura_detalles');
    }
};