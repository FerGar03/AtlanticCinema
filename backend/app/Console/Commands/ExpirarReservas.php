<?php

namespace App\Console\Commands;

use App\Models\FuncionAsiento;
use App\Models\Reserva;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('app:expirar-reservas')]
#[Description('Marca reservas vencidas y libera sus asientos.')]
class ExpirarReservas extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $reservasVencidas = 0;
        $asientosLiberados = 0;

        Reserva::query()
            ->where('estado', 'PENDIENTE')
            ->where('expira_en', '<=', now())
            ->orderBy('id')
            ->chunkById(
                100,
                function ($reservas) use (
                    &$reservasVencidas,
                    &$asientosLiberados
                ): void {
                    foreach ($reservas as $reserva) {
                        DB::transaction(function () use (
                            $reserva,
                            &$reservasVencidas,
                            &$asientosLiberados
                        ): void {
                            $reservaBloqueada = Reserva::query()
                                ->with([
                                    'detalles.funcionAsiento',
                                ])
                                ->lockForUpdate()
                                ->find($reserva->id);

                            if (! $reservaBloqueada) {
                                return;
                            }

                            if (
                                $reservaBloqueada->estado
                                !== 'PENDIENTE'
                            ) {
                                return;
                            }

                            if (
                                $reservaBloqueada->expira_en
                                    ->isFuture()
                            ) {
                                return;
                            }

                            foreach (
                                $reservaBloqueada->detalles
                                as $detalle
                            ) {
                                if (
                                    $detalle->estado
                                    === 'RESERVADO'
                                ) {
                                    $detalle->update([
                                        'estado' => 'LIBERADO',
                                    ]);
                                }

                                $funcionAsiento =
                                    $detalle->funcionAsiento;

                                if (
                                    ! $funcionAsiento ||
                                    $funcionAsiento->estado
                                    !== 'RESERVADO'
                                ) {
                                    continue;
                                }

                                FuncionAsiento::query()
                                    ->whereKey(
                                        $funcionAsiento->id
                                    )
                                    ->where(
                                        'estado',
                                        'RESERVADO'
                                    )
                                    ->update([
                                        'estado' => 'DISPONIBLE',
                                        'bloqueado_hasta' => null,
                                    ]);

                                $asientosLiberados++;
                            }

                            $reservaBloqueada->update([
                                'estado' => 'VENCIDA',
                            ]);

                            $reservasVencidas++;
                        }, 3);
                    }
                }
            );

        $this->info(
            "Reservas vencidas: {$reservasVencidas}. "
            . "Asientos liberados: {$asientosLiberados}."
        );

        return self::SUCCESS;
    }
}