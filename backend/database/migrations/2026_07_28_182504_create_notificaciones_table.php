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
        Schema::create('notificaciones', function (Blueprint $table) {
            $table->id();

            $table->foreignId('usuario_id')
                ->nullable()
                ->constrained('usuarios')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->foreignId('venta_id')
                ->nullable()
                ->constrained('ventas')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->foreignId('reserva_id')
                ->nullable()
                ->constrained('reservas')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->foreignId('factura_id')
                ->nullable()
                ->constrained('facturas')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->foreignId('ticket_id')
                ->nullable()
                ->constrained('tickets')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->string('canal', 20);
            $table->string('destinatario', 254);
            $table->string('asunto', 255)->nullable();
            $table->text('mensaje');
            $table->string('estado', 20)->default('PENDIENTE');

            $table->timestampTz('enviada_en')->nullable();
            $table->timestampTz('leida_en')->nullable();

            $table->timestampsTz();

            $table->index('usuario_id');
            $table->index('venta_id');
            $table->index('reserva_id');
            $table->index('factura_id');
            $table->index('ticket_id');
            $table->index('estado');
            $table->index('canal');
        });

        DB::statement("
            ALTER TABLE notificaciones
            ADD CONSTRAINT notificaciones_canal_check
            CHECK (
                canal IN (
                    'EMAIL',
                    'SMS',
                    'PUSH',
                    'SISTEMA'
                )
            )
        ");

        DB::statement("
            ALTER TABLE notificaciones
            ADD CONSTRAINT notificaciones_estado_check
            CHECK (
                estado IN (
                    'PENDIENTE',
                    'ENVIADA',
                    'ENTREGADA',
                    'LEIDA',
                    'FALLIDA'
                )
            )
        ");

        DB::statement("
            COMMENT ON TABLE notificaciones IS
            'Notificaciones generadas por el sistema para usuarios y clientes'
        ");

        DB::statement("
            COMMENT ON COLUMN notificaciones.usuario_id IS
            'Usuario relacionado con la notificación, cuando corresponda'
        ");

        DB::statement("
            COMMENT ON COLUMN notificaciones.venta_id IS
            'Venta relacionada con la notificación, cuando corresponda'
        ");

        DB::statement("
            COMMENT ON COLUMN notificaciones.reserva_id IS
            'Reserva relacionada con la notificación, cuando corresponda'
        ");

        DB::statement("
            COMMENT ON COLUMN notificaciones.factura_id IS
            'Factura relacionada con la notificación, cuando corresponda'
        ");

        DB::statement("
            COMMENT ON COLUMN notificaciones.ticket_id IS
            'Ticket relacionado con la notificación, cuando corresponda'
        ");

        DB::statement("
            COMMENT ON COLUMN notificaciones.canal IS
            'Canal utilizado: EMAIL, SMS, PUSH o SISTEMA'
        ");

        DB::statement("
            COMMENT ON COLUMN notificaciones.destinatario IS
            'Correo, teléfono, identificador o destino de la notificación'
        ");

        DB::statement("
            COMMENT ON COLUMN notificaciones.asunto IS
            'Asunto de la notificación'
        ");

        DB::statement("
            COMMENT ON COLUMN notificaciones.mensaje IS
            'Contenido de la notificación'
        ");

        DB::statement("
            COMMENT ON COLUMN notificaciones.estado IS
            'Estado: PENDIENTE, ENVIADA, ENTREGADA, LEIDA o FALLIDA'
        ");

        DB::statement("
            COMMENT ON COLUMN notificaciones.enviada_en IS
            'Fecha y hora en que se realizó el envío'
        ");

        DB::statement("
            COMMENT ON COLUMN notificaciones.leida_en IS
            'Fecha y hora en que la notificación fue leída'
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('notificaciones');
    }
};