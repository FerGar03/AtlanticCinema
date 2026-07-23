<?php

namespace Database\Seeders;

use App\Models\Genero;
use Illuminate\Database\Seeder;

class GeneroSeeder extends Seeder
{
    /**
     * Ejecuta el seeder.
     */
    public function run(): void
    {
        $generos = [

            [
                'nombre' => 'Acción',
                'descripcion' => 'Películas con escenas de combate, persecuciones y alto dinamismo.',
            ],
            [
                'nombre' => 'Animación',
                'descripcion' => 'Películas creadas mediante técnicas de animación para distintos públicos.',
            ],
            [
                'nombre' => 'Aventura',
                'descripcion' => 'Películas centradas en viajes, exploración y descubrimiento.',
            ],
            [
                'nombre' => 'Ciencia ficción',
                'descripcion' => 'Películas basadas en avances científicos, tecnología o futuros imaginarios.',
            ],
            [
                'nombre' => 'Comedia',
                'descripcion' => 'Películas orientadas al humor y al entretenimiento.',
            ],
            [
                'nombre' => 'Documental',
                'descripcion' => 'Producciones basadas en hechos reales, investigación o divulgación.',
            ],
            [
                'nombre' => 'Drama',
                'descripcion' => 'Películas con énfasis en conflictos emocionales y desarrollo de personajes.',
            ],
            [
                'nombre' => 'Fantasía',
                'descripcion' => 'Películas con elementos mágicos, mitológicos o sobrenaturales.',
            ],
            [
                'nombre' => 'Musical',
                'descripcion' => 'Películas donde la música y las canciones forman parte esencial de la narrativa.',
            ],
            [
                'nombre' => 'Romance',
                'descripcion' => 'Películas centradas en relaciones sentimentales y afectivas.',
            ],
            [
                'nombre' => 'Suspenso',
                'descripcion' => 'Películas que generan expectativa, tensión y misterio.',
            ],
            [
                'nombre' => 'Terror',
                'descripcion' => 'Películas diseñadas para provocar miedo, tensión o inquietud.',
            ],

        ];

        foreach ($generos as $genero) {
            Genero::updateOrCreate(
                ['nombre' => $genero['nombre']],
                [
                    'descripcion' => $genero['descripcion'],
                    'estado' => 'ACTIVO',
                ]
            );
        }
    }
}