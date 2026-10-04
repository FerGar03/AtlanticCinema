<?php

namespace App\Console\Commands;

use App\Models\Funcion;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ActualizarEstadosFunciones extends Command
{
    /**
     * Nombre y firma del comando.
     */
    protected $signature =
        'app:actualizar-estados-funciones';

    /**
     * Descripción mostrada por Artisan.
     */
    protected $description =
        'Actualiza automáticamente los estados de las funciones según su horario.';

    /**
     * Ejecuta la actualización de estados.
     */
    public function handle(): int
    {
        $ahora = now();

        $resultado =
            DB::transaction(
                function () use (
                    $ahora
                ): array {
                    /*
                     * Una función se considera
                     * FINALIZADA cuando su hora
                     * de finalización ya llegó
                     * o quedó en el pasado.
                     *
                     * Se incluyen tanto funciones
                     * PROGRAMADAS como ACTIVAS.
                     *
                     * Esto también permite corregir
                     * funciones antiguas que nunca
                     * fueron actualizadas porque el
                     * scheduler no estaba funcionando.
                     */
                    $finalizadas =
                        Funcion::query()
                            ->whereIn(
                                'estado',
                                [
                                    'PROGRAMADA',
                                    'ACTIVA',
                                ]
                            )
                            ->where(
                                'finaliza_en',
                                '<=',
                                $ahora
                            )
                            ->update([
                                'estado' =>
                                    'FINALIZADA',

                                'updated_at' =>
                                    $ahora,
                            ]);

                    /*
                     * Una función pasa a ACTIVA
                     * cuando:
                     *
                     * - ya llegó su hora de inicio;
                     * - todavía no ha llegado su
                     *   hora de finalización;
                     * - continúa PROGRAMADA.
                     */
                    $activadas =
                        Funcion::query()
                            ->where(
                                'estado',
                                'PROGRAMADA'
                            )
                            ->where(
                                'inicia_en',
                                '<=',
                                $ahora
                            )
                            ->where(
                                'finaliza_en',
                                '>',
                                $ahora
                            )
                            ->update([
                                'estado' =>
                                    'ACTIVA',

                                'updated_at' =>
                                    $ahora,
                            ]);

                    return [
                        'activadas' =>
                            $activadas,

                        'finalizadas' =>
                            $finalizadas,
                    ];
                }
            );

        $this->info(
            'Estados de funciones actualizados correctamente.'
        );

        $this->line(
            'Funciones activadas: '
            . $resultado[
                'activadas'
            ]
        );

        $this->line(
            'Funciones finalizadas: '
            . $resultado[
                'finalizadas'
            ]
        );

        return self::SUCCESS;
    }
}