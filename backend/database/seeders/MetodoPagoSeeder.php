<?php

namespace Database\Seeders;

use App\Models\MetodoPago;
use Illuminate\Database\Seeder;

class MetodoPagoSeeder extends Seeder
{
    public function run(): void
    {
        $metodos = [
            [
                'codigo' => 'EFECTIVO',
                'nombre' => 'Efectivo',
                'descripcion' => 'Pago realizado en efectivo en la taquilla de Atlantic Cinema.',
                'estado' => 'ACTIVO',
            ],
            [
                'codigo' => 'TARJETA',
                'nombre' => 'Tarjeta',
                'descripcion' => 'Pago realizado con tarjeta mediante la pasarela de pago autorizada.',
                'estado' => 'ACTIVO',
            ],
        ];

        foreach ($metodos as $metodo) {
            MetodoPago::updateOrCreate(
                ['codigo' => $metodo['codigo']],
                $metodo
            );
        }
    }
}