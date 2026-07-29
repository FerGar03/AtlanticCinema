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
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();

            $table->foreignId('entrada_id')
                ->constrained('entradas')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('codigo', 50)->unique();
            $table->string('token_validacion', 255)->unique();

            $table->string('formato', 20)->default('PDF');
            $table->string('estado', 20)->default('ACTIVO');

            $table->string('pdf_url', 500)->nullable();
            $table->string('qr_url', 500)->nullable();

            $table->timestampTz('generado_en');
            $table->timestampTz('utilizado_en')->nullable();
            $table->timestampTz('cancelado_en')->nullable();
            $table->timestampTz('invalidado_en')->nullable();

            $table->text('motivo_invalidacion')->nullable();

            $table->unsignedSmallInteger('version')->default(1);

            $table->timestampsTz();

            $table->index('entrada_id');
            $table->index('estado');
            $table->index('generado_en');
        });

        DB::statement("
            ALTER TABLE tickets
            ADD CONSTRAINT tickets_formato_check
            CHECK (formato IN ('PDF', 'DIGITAL'))
        ");

        DB::statement("
            ALTER TABLE tickets
            ADD CONSTRAINT tickets_estado_check
            CHECK (
                estado IN (
                    'ACTIVO',
                    'UTILIZADO',
                    'CANCELADO',
                    'INVALIDADO'
                )
            )
        ");

        DB::statement("
            ALTER TABLE tickets
            ADD CONSTRAINT tickets_version_check
            CHECK (version > 0)
        ");

        DB::statement("
            CREATE UNIQUE INDEX tickets_entrada_activo_unique
            ON tickets (entrada_id)
            WHERE estado = 'ACTIVO'
        ");

        DB::statement("
            COMMENT ON TABLE tickets IS
            'Tickets electrónicos generados para las entradas vendidas'
        ");

        DB::statement("
            COMMENT ON COLUMN tickets.entrada_id IS
            'Entrada a la que pertenece el ticket'
        ");

        DB::statement("
            COMMENT ON COLUMN tickets.codigo IS
            'Código público único del ticket'
        ");

        DB::statement("
            COMMENT ON COLUMN tickets.token_validacion IS
            'Token único utilizado para validar la autenticidad del ticket'
        ");

        DB::statement("
            COMMENT ON COLUMN tickets.formato IS
            'Formato de representación del ticket: PDF o DIGITAL'
        ");

        DB::statement("
            COMMENT ON COLUMN tickets.estado IS
            'Estado del ticket: ACTIVO, UTILIZADO, CANCELADO o INVALIDADO'
        ");

        DB::statement("
            COMMENT ON COLUMN tickets.pdf_url IS
            'Ruta o URL del archivo PDF generado para el ticket'
        ");

        DB::statement("
            COMMENT ON COLUMN tickets.qr_url IS
            'Ruta o URL de la imagen QR generada para el ticket'
        ");

        DB::statement("
            COMMENT ON COLUMN tickets.generado_en IS
            'Fecha y hora de generación del ticket'
        ");

        DB::statement("
            COMMENT ON COLUMN tickets.utilizado_en IS
            'Fecha y hora en que el ticket fue utilizado'
        ");

        DB::statement("
            COMMENT ON COLUMN tickets.cancelado_en IS
            'Fecha y hora en que el ticket fue cancelado'
        ");

        DB::statement("
            COMMENT ON COLUMN tickets.invalidado_en IS
            'Fecha y hora en que el ticket fue invalidado o reemplazado'
        ");

        DB::statement("
            COMMENT ON COLUMN tickets.motivo_invalidacion IS
            'Motivo por el que el ticket fue invalidado'
        ");

        DB::statement("
            COMMENT ON COLUMN tickets.version IS
            'Número de versión del ticket para controlar reemisiones'
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};