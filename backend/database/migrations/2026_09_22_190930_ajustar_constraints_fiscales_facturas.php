<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        /*
         * FACTURAS
         *
         * Modelo fiscal con IVA incluido:
         *
         * subtotal
         * - descuento
         * + impuestos
         * = total
         *
         * Se mantiene esta regla porque ahora
         * subtotal representa la base imponible.
         */

        /*
         * FACTURA_DETALLES
         *
         * Antes:
         * subtotal = cantidad * precio_unitario
         *
         * Eso asumía que precio_unitario era
         * un precio sin impuestos.
         *
         * Ahora precio_unitario representa el
         * precio final de la entrada con IVA
         * incluido, mientras que subtotal
         * representa la base imponible.
         */

        DB::statement(
            'ALTER TABLE factura_detalles
             DROP CONSTRAINT IF EXISTS factura_detalles_subtotal_calculo_check'
        );

        DB::statement(
            'ALTER TABLE factura_detalles
             DROP CONSTRAINT IF EXISTS factura_detalles_total_calculo_check'
        );

        /*
         * Nueva regla:
         *
         * subtotal + impuesto - descuento
         * debe coincidir con total_linea.
         */
        DB::statement(
            'ALTER TABLE factura_detalles
             ADD CONSTRAINT factura_detalles_total_calculo_check
             CHECK (
                total_linea =
                subtotal - descuento + monto_impuesto
             )'
        );

        /*
         * El precio unitario representa el
         * precio final comercial de la entrada.
         *
         * Como la cantidad de entradas por
         * detalle es siempre 1, debe coincidir
         * con total_linea.
         */
        DB::statement(
            'ALTER TABLE factura_detalles
             ADD CONSTRAINT factura_detalles_precio_total_check
             CHECK (
                total_linea =
                cantidad * precio_unitario
             )'
        );
    }

    public function down(): void
    {
        DB::statement(
            'ALTER TABLE factura_detalles
             DROP CONSTRAINT IF EXISTS factura_detalles_precio_total_check'
        );

        DB::statement(
            'ALTER TABLE factura_detalles
             DROP CONSTRAINT IF EXISTS factura_detalles_total_calculo_check'
        );

        DB::statement(
            'ALTER TABLE factura_detalles
             ADD CONSTRAINT factura_detalles_subtotal_calculo_check
             CHECK (
                subtotal =
                cantidad * precio_unitario
             )'
        );

        DB::statement(
            'ALTER TABLE factura_detalles
             ADD CONSTRAINT factura_detalles_total_calculo_check
             CHECK (
                total_linea =
                subtotal - descuento + monto_impuesto
             )'
        );
    }
};