<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table(
            'ventas',
            function (Blueprint $table): void {
                $table
                    ->string(
                        'nit_facturacion',
                        20
                    )
                    ->default('CF')
                    ->after('total');

                $table
                    ->string(
                        'nombre_facturacion',
                        255
                    )
                    ->default('Consumidor Final')
                    ->after('nit_facturacion');
            }
        );
    }

    public function down(): void
    {
        Schema::table(
            'ventas',
            function (Blueprint $table): void {
                $table->dropColumn([
                    'nit_facturacion',
                    'nombre_facturacion',
                ]);
            }
        );
    }
};