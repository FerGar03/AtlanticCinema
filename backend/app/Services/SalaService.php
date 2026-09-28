<?php

namespace App\Services;

use App\Models\Sala;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SalaService
{
    /**
     * Crea una sala junto con su
     * distribución física de asientos.
     *
     * @param array<string, mixed> $datos
     */
    public function crear(
        array $datos
    ): Sala {
        return DB::transaction(
            function () use (
                $datos
            ): Sala {
                $filas = collect(
                    $datos['filas']
                )
                    ->map(
                        function (
                            array $fila
                        ): array {
                            return [
                                'fila' =>
                                    strtoupper(
                                        trim(
                                            $fila[
                                                'fila'
                                            ]
                                        )
                                    ),

                                'cantidad' =>
                                    (int)
                                    $fila[
                                        'cantidad'
                                    ],
                            ];
                        }
                    )
                    ->values();

                if ($filas->isEmpty()) {
                    throw ValidationException::withMessages([
                        'filas' =>
                            'Debe configurar al menos una fila de asientos.',
                    ]);
                }

                /*
                 * Evitamos filas duplicadas
                 * también a nivel de servicio.
                 */
                if (
                    $filas
                        ->pluck('fila')
                        ->unique()
                        ->count()
                    !== $filas->count()
                ) {
                    throw ValidationException::withMessages([
                        'filas' =>
                            'No puede existir la misma fila más de una vez.',
                    ]);
                }

                $capacidad =
                    (int) $filas->sum(
                        'cantidad'
                    );

                if ($capacidad <= 0) {
                    throw ValidationException::withMessages([
                        'filas' =>
                            'La sala debe contener al menos un asiento.',
                    ]);
                }

                $sala =
                    Sala::query()
                        ->create([
                            'nombre' =>
                                $datos[
                                    'nombre'
                                ],

                            /*
                             * La capacidad no se recibe
                             * del frontend.
                             *
                             * Se calcula a partir de
                             * los asientos configurados.
                             */
                            'capacidad' =>
                                $capacidad,

                            'descripcion' =>
                                $datos[
                                    'descripcion'
                                ] ?? null,

                            'estado' =>
                                $datos[
                                    'estado'
                                ]
                                ?? 'ACTIVA',
                        ]);

                $asientos = [];

                foreach (
                    $filas
                    as $fila
                ) {
                    for (
                        $numero = 1;
                        $numero
                            <= $fila[
                                'cantidad'
                            ];
                        $numero++
                    ) {
                        $asientos[] = [
                            'fila' =>
                                $fila[
                                    'fila'
                                ],

                            'numero' =>
                                $numero,

                            'tipo' =>
                                'NORMAL',

                            'estado' =>
                                'ACTIVO',
                        ];
                    }
                }

                $sala
                    ->asientos()
                    ->createMany(
                        $asientos
                    );

                $sala->load([
                    'asientos' =>
                        fn ($query) =>
                            $query
                                ->orderBy(
                                    'fila'
                                )
                                ->orderBy(
                                    'numero'
                                ),
                ]);

                $sala->loadCount([
                    'asientos' =>
                        fn ($query) =>
                            $query->where(
                                'estado',
                                'ACTIVO'
                            ),
                ]);

                return $sala;
            },
            3
        );
    }
}