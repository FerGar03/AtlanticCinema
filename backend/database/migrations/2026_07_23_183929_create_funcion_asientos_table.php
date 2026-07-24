<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('funcion_asientos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('funcion_id')
                ->constrained('funciones')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('asiento_id')
                ->constrained('asientos')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->decimal('precio', 10, 2);

            $table->string('estado', 20)
                ->default('DISPONIBLE');

            $table->timestampTz('bloqueado_hasta')
                ->nullable();

            $table->timestampsTz();

            $table->unique(
                ['funcion_id', 'asiento_id'],
                'funcion_asientos_funcion_asiento_unique'
            );

            $table->index('funcion_id');
            $table->index('asiento_id');
            $table->index('estado');
            $table->index('bloqueado_hasta');
        });

        DB::statement("
            ALTER TABLE funcion_asientos
            ADD CONSTRAINT funcion_asientos_precio_check
            CHECK (precio >= 0)
        ");

        DB::statement("
            ALTER TABLE funcion_asientos
            ADD CONSTRAINT funcion_asientos_estado_check
            CHECK (
                estado IN (
                    'DISPONIBLE',
                    'RESERVADO',
                    'VENDIDO',
                    'BLOQUEADO'
                )
            )
        ");

        DB::statement("
            COMMENT ON TABLE funcion_asientos IS
            'Estado y precio de cada asiento para una función específica'
        ");

        DB::statement("
            COMMENT ON COLUMN funcion_asientos.funcion_id IS
            'Función cinematográfica a la que pertenece el asiento'
        ");

        DB::statement("
            COMMENT ON COLUMN funcion_asientos.asiento_id IS
            'Asiento físico asociado dentro de la sala'
        ");

        DB::statement("
            COMMENT ON COLUMN funcion_asientos.precio IS
            'Precio del asiento para la función'
        ");

        DB::statement("
            COMMENT ON COLUMN funcion_asientos.estado IS
            'Estado del asiento: DISPONIBLE, RESERVADO, VENDIDO o BLOQUEADO'
        ");

        DB::statement("
            COMMENT ON COLUMN funcion_asientos.bloqueado_hasta IS
            'Fecha y hora hasta la que se mantiene un bloqueo temporal'
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('funcion_asientos');
    }
};