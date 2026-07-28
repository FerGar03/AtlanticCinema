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
        Schema::create('facturas', function (Blueprint $table) {
            $table->id();

            $table->foreignId('venta_id')
                ->constrained('ventas')
                ->restrictOnUpdate()
                ->restrictOnDelete();

            $table->string('numero_interno', 30)->unique();
            $table->string('tipo_documento', 20)->default('FACTURA');

            $table->string('serie', 50)->nullable();
            $table->string('numero_documento', 50)->nullable();
            $table->string('uuid', 100)->nullable()->unique();

            $table->string('nit_receptor', 20)->default('CF');
            $table->string('nombre_receptor', 255);

            $table->decimal('subtotal', 12, 2);
            $table->decimal('descuento', 12, 2)->default(0);
            $table->decimal('impuestos', 12, 2)->default(0);
            $table->decimal('total', 12, 2);

            $table->string('estado', 20)->default('PENDIENTE');
            $table->timestampTz('certificada_en')->nullable();

            $table->timestampsTz();

            $table->unique('venta_id', 'facturas_venta_id_unique');
        });

        DB::statement("
            ALTER TABLE facturas
            ADD CONSTRAINT facturas_tipo_documento_check
            CHECK (tipo_documento IN ('FACTURA'))
        ");

        DB::statement("
            ALTER TABLE facturas
            ADD CONSTRAINT facturas_estado_check
            CHECK (
                estado IN (
                    'PENDIENTE',
                    'CERTIFICADA',
                    'ERROR',
                    'ANULADA'
                )
            )
        ");

        DB::statement("
            ALTER TABLE facturas
            ADD CONSTRAINT facturas_subtotal_check
            CHECK (subtotal >= 0)
        ");

        DB::statement("
            ALTER TABLE facturas
            ADD CONSTRAINT facturas_descuento_check
            CHECK (descuento >= 0)
        ");

        DB::statement("
            ALTER TABLE facturas
            ADD CONSTRAINT facturas_impuestos_check
            CHECK (impuestos >= 0)
        ");

        DB::statement("
            ALTER TABLE facturas
            ADD CONSTRAINT facturas_total_check
            CHECK (total > 0)
        ");

        DB::statement("
            ALTER TABLE facturas
            ADD CONSTRAINT facturas_montos_check
            CHECK (total = subtotal - descuento + impuestos)
        ");

        DB::statement("
            COMMENT ON TABLE facturas IS
            'Facturas electrónicas FEL generadas a partir de ventas pagadas.'
        ");

        DB::statement("
            COMMENT ON COLUMN facturas.venta_id IS
            'Venta pagada que origina la factura electrónica.'
        ");

        DB::statement("
            COMMENT ON COLUMN facturas.numero_interno IS
            'Número único generado internamente por Atlantic Cinema.'
        ");

        DB::statement("
            COMMENT ON COLUMN facturas.tipo_documento IS
            'Tipo de documento tributario electrónico generado.'
        ");

        DB::statement("
            COMMENT ON COLUMN facturas.serie IS
            'Serie asignada por el proveedor FEL después de la certificación.'
        ");

        DB::statement("
            COMMENT ON COLUMN facturas.numero_documento IS
            'Número asignado por el proveedor FEL después de la certificación.'
        ");

        DB::statement("
            COMMENT ON COLUMN facturas.uuid IS
            'Identificador único de autorización proporcionado por el proveedor FEL.'
        ");

        DB::statement("
            COMMENT ON COLUMN facturas.nit_receptor IS
            'NIT del receptor de la factura o CF para consumidor final.'
        ");

        DB::statement("
            COMMENT ON COLUMN facturas.nombre_receptor IS
            'Nombre fiscal del receptor de la factura.'
        ");

        DB::statement("
            COMMENT ON COLUMN facturas.estado IS
            'Estado del proceso de generación y certificación FEL.'
        ");

        DB::statement("
            COMMENT ON COLUMN facturas.certificada_en IS
            'Fecha y hora en que la factura fue certificada correctamente.'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('facturas');
    }
};