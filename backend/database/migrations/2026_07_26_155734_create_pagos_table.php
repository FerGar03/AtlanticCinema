<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('venta_id')
                ->constrained('ventas')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('metodo_pago_id')
                ->constrained('metodos_pago')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('proveedor', 100)->nullable();

            $table->string('referencia_proveedor', 255)->nullable();

            $table->decimal('monto', 10, 2);

            $table->string('moneda', 10)->default('GTQ');

            $table->string('estado', 20)->default('PENDIENTE');

            $table->string('autorizacion_codigo', 255)->nullable();

            $table->timestampTz('aprobado_en')->nullable();

            $table->text('descripcion')->nullable();

            $table->timestampsTz();
        });

        DB::statement("
            ALTER TABLE pagos
            ADD CONSTRAINT pagos_estado_check
            CHECK (
                estado IN (
                    'PENDIENTE',
                    'APROBADO',
                    'RECHAZADO',
                    'ANULADO',
                    'REEMBOLSADO'
                )
            )
        ");

        DB::statement("
            CREATE UNIQUE INDEX pagos_venta_aprobado_unique
            ON pagos (venta_id)
            WHERE estado = 'APROBADO'
        ");

        DB::statement("
            COMMENT ON TABLE pagos IS
            'Registro de pagos e intentos de pago asociados a una venta'
        ");

        DB::statement("
            COMMENT ON COLUMN pagos.venta_id IS
            'Venta asociada al pago'
        ");

        DB::statement("
            COMMENT ON COLUMN pagos.metodo_pago_id IS
            'Método de pago utilizado'
        ");

        DB::statement("
            COMMENT ON COLUMN pagos.proveedor IS
            'Proveedor que procesa el pago (Stripe, Taquilla, etc.)'
        ");

        DB::statement("
            COMMENT ON COLUMN pagos.referencia_proveedor IS
            'Identificador devuelto por el proveedor'
        ");

        DB::statement("
            COMMENT ON COLUMN pagos.monto IS
            'Monto procesado'
        ");

        DB::statement("
            COMMENT ON COLUMN pagos.moneda IS
            'Moneda utilizada'
        ");

        DB::statement("
            COMMENT ON COLUMN pagos.estado IS
            'Estado actual del pago'
        ");

        DB::statement("
            COMMENT ON COLUMN pagos.autorizacion_codigo IS
            'Código de autorización del proveedor'
        ");

        DB::statement("
            COMMENT ON COLUMN pagos.aprobado_en IS
            'Fecha y hora en que el pago fue aprobado'
        ");

        DB::statement("
            COMMENT ON COLUMN pagos.descripcion IS
            'Observaciones del pago'
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};