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
        Schema::create('reserva_detalles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('reserva_id')
                ->constrained('reservas')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('funcion_asiento_id')
                ->constrained('funcion_asientos')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->decimal('precio', 12, 2);

            $table->string('estado', 20)->default('RESERVADO');

            $table->timestampsTz();

            $table->unique(
                ['reserva_id', 'funcion_asiento_id'],
                'reserva_detalles_reserva_asiento_unique'
            );
        });

        DB::statement("
            ALTER TABLE reserva_detalles
            ADD CONSTRAINT reserva_detalles_precio_check
            CHECK (precio > 0)
        ");

        DB::statement("
            ALTER TABLE reserva_detalles
            ADD CONSTRAINT reserva_detalles_estado_check
            CHECK (
                estado IN (
                    'RESERVADO',
                    'LIBERADO',
                    'CONVERTIDO'
                )
            )
        ");

        DB::statement("
            CREATE UNIQUE INDEX reserva_detalles_asiento_reservado_unique
            ON reserva_detalles (funcion_asiento_id)
            WHERE estado = 'RESERVADO'
        ");

        DB::statement("
            COMMENT ON TABLE reserva_detalles IS
            'Detalle de los asientos incluidos en cada reserva'
        ");

        DB::statement("
            COMMENT ON COLUMN reserva_detalles.reserva_id IS
            'Reserva a la que pertenece el detalle'
        ");

        DB::statement("
            COMMENT ON COLUMN reserva_detalles.funcion_asiento_id IS
            'Asiento específico perteneciente al mapa de una función'
        ");

        DB::statement("
            COMMENT ON COLUMN reserva_detalles.precio IS
            'Precio del asiento registrado al momento de crear la reserva'
        ");

        DB::statement("
            COMMENT ON COLUMN reserva_detalles.estado IS
            'Estado del detalle: RESERVADO, LIBERADO o CONVERTIDO'
        ");
    }

    /**
     * Revierte la migración.
     */
    public function down(): void
    {
        Schema::dropIfExists('reserva_detalles');
    }
};