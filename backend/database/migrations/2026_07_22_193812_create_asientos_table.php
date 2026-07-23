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
        Schema::create('asientos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sala_id')
                ->constrained('salas')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('fila', 10);

            $table->string('numero', 10);

            $table->string('tipo', 20)
                ->default('NORMAL');

            $table->string('estado', 20)
                ->default('ACTIVO');

            $table->timestampsTz();

            $table->unique([
                'sala_id',
                'fila',
                'numero'
            ], 'uk_asiento_sala_fila_numero');
        });

        DB::statement("
            ALTER TABLE asientos
            ADD CONSTRAINT chk_asientos_tipo
            CHECK (tipo IN (
                'NORMAL',
                'PREFERENCIAL',
                'DISCAPACIDAD'
            ));
        ");

        DB::statement("
            ALTER TABLE asientos
            ADD CONSTRAINT chk_asientos_estado
            CHECK (estado IN (
                'ACTIVO',
                'INACTIVO'
            ));
        ");

        DB::statement("
            COMMENT ON TABLE asientos IS
            'Distribución física de asientos de cada sala.';
        ");

        DB::statement("
            COMMENT ON COLUMN asientos.id IS
            'Identificador único del asiento.';
        ");

        DB::statement("
            COMMENT ON COLUMN asientos.sala_id IS
            'Sala a la que pertenece el asiento.';
        ");

        DB::statement("
            COMMENT ON COLUMN asientos.fila IS
            'Fila del asiento.';
        ");

        DB::statement("
            COMMENT ON COLUMN asientos.numero IS
            'Número del asiento.';
        ");

        DB::statement("
            COMMENT ON COLUMN asientos.tipo IS
            'Tipo físico del asiento.';
        ");

        DB::statement("
            COMMENT ON COLUMN asientos.estado IS
            'Estado del asiento dentro de la sala.';
        ");

        DB::statement("
            COMMENT ON COLUMN asientos.created_at IS
            'Fecha de creación.';
        ");

        DB::statement("
            COMMENT ON COLUMN asientos.updated_at IS
            'Fecha de última actualización.';
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asientos');
    }
};