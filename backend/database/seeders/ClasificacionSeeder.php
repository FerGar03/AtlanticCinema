<?php

namespace Database\Seeders;

use App\Models\Clasificacion;
use Illuminate\Database\Seeder;

class ClasificacionSeeder extends Seeder
{
    /**
     * Ejecuta el seeder.
     */
    public function run(): void
    {
        $clasificaciones = [

    [
        'nombre' => 'A',
        'descripcion' => 'Apta para todo público.',
        'edad_minima' => 0,
        'color' => '#4CAF50',
    ],
    [
        'nombre' => 'B',
        'descripcion' => 'Recomendada para mayores de 12 años.',
        'edad_minima' => 12,
        'color' => '#8BC34A',
    ],
    [
        'nombre' => 'C',
        'descripcion' => 'Recomendada para mayores de 15 años.',
        'edad_minima' => 15,
        'color' => '#FFC107',
    ],
    [
        'nombre' => 'D',
        'descripcion' => 'Exclusiva para mayores de 18 años.',
        'edad_minima' => 18,
        'color' => '#F44336',
    ],

];

        foreach ($clasificaciones as $clasificacion) {
            Clasificacion::updateOrCreate(
                ['nombre' => $clasificacion['nombre']],
                [
                    'descripcion' => $clasificacion['descripcion'],
                    'edad_minima' => $clasificacion['edad_minima'],
                    'color' => $clasificacion['color'],
                    'estado' => 'ACTIVO',
                ]
            );
        }
    }
}