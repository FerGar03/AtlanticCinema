<?php

namespace Database\Seeders;

use App\Models\Formato;
use Illuminate\Database\Seeder;

class FormatoSeeder extends Seeder
{
    /**
     * Ejecuta el seeder.
     */
    public function run(): void
    {
        $formatos = [

    [
        'nombre' => '2D',
        'descripcion' => 'Proyección tradicional en dos dimensiones.',
    ],
    [
        'nombre' => '3D',
        'descripcion' => 'Proyección estereoscópica en tres dimensiones.',
    ],

];

        foreach ($formatos as $formato) {
            Formato::updateOrCreate(
                ['nombre' => $formato['nombre']],
                [
                    'descripcion' => $formato['descripcion'],
                    'estado' => 'ACTIVO',
                ]
            );
        }
    }
}