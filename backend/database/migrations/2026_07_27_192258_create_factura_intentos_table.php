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
        Schema::create('factura_intentos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('factura_id')
                ->constrained('facturas')
                ->restrictOnUpdate()
                ->restrictOnDelete();

            $table->unsignedInteger('numero_intento');
            $table->string('operacion', 30)->default('CERTIFICACION');
            $table->string('estado', 20)->default('PENDIENTE');

            $table->uuid('idempotency_key')->unique();

            $table->string('codigo_respuesta', 100)->nullable();
            $table->text('mensaje_respuesta')->nullable();

            $table->jsonb('solicitud')->nullable();
            $table->jsonb('respuesta')->nullable();

            $table->timestampTz('procesado_en')->nullable();

            $table->timestampsTz();

            $table->unique(
                ['factura_id', 'numero_intento'],
                'factura_intentos_factura_numero_unique'
            );

            $table->index(
                ['factura_id', 'estado'],
                'factura_intentos_factura_estado_index'
            );
        });

        DB::statement("
            ALTER TABLE factura_intentos
            ADD CONSTRAINT factura_intentos_numero_check
            CHECK (numero_intento > 0)
        ");

        DB::statement("
            ALTER TABLE factura_intentos
            ADD CONSTRAINT factura_intentos_operacion_check
            CHECK (
                operacion IN (
                    'CERTIFICACION',
                    'ANULACION'
                )
            )
        ");

        DB::statement("
            ALTER TABLE factura_intentos
            ADD CONSTRAINT factura_intentos_estado_check
            CHECK (
                estado IN (
                    'PENDIENTE',
                    'EXITOSO',
                    'ERROR'
                )
            )
        ");

        DB::statement("
            COMMENT ON TABLE factura_intentos IS
            'Historial de intentos de comunicación con el proveedor o simulador FEL.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_intentos.factura_id IS
            'Factura electrónica relacionada con el intento.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_intentos.numero_intento IS
            'Número correlativo del intento realizado para la factura.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_intentos.operacion IS
            'Operación solicitada al proveedor FEL: certificación o anulación.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_intentos.estado IS
            'Resultado del intento de comunicación con el proveedor FEL.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_intentos.idempotency_key IS
            'Identificador único que permite evitar el procesamiento duplicado de una solicitud FEL.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_intentos.codigo_respuesta IS
            'Código retornado por el proveedor o simulador FEL.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_intentos.mensaje_respuesta IS
            'Mensaje descriptivo retornado durante el procesamiento.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_intentos.solicitud IS
            'Contenido JSON enviado al proveedor o simulador FEL.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_intentos.respuesta IS
            'Contenido JSON recibido del proveedor o simulador FEL.'
        ");

        DB::statement("
            COMMENT ON COLUMN factura_intentos.procesado_en IS
            'Fecha y hora en que el proveedor terminó de procesar el intento.'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('factura_intentos');
    }
};