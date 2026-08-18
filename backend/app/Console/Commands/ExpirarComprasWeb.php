<?php

namespace App\Console\Commands;

use App\Models\FuncionAsiento;
use App\Models\Venta;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('app:expirar-compras-web')]
#[Description('Cancela compras web vencidas y libera sus asientos.')]
class ExpirarComprasWeb extends Command
{
    public function handle(): int
    {
        $ventasCanceladas = 0;
        $asientosLiberados = 0;

        Venta::query()
            ->where('origen', 'COMPRA_WEB')
            ->where('estado', 'PENDIENTE')
            ->orderBy('id')
            ->chunkById(
                100,
                function ($ventas) use (
                    &$ventasCanceladas,
                    &$asientosLiberados
                ): void {
                    foreach ($ventas as $venta) {
                        DB::transaction(
                            function () use (
                                $venta,
                                &$ventasCanceladas,
                                &$asientosLiberados
                            ): void {
                                $ventaBloqueada = Venta::query()
                                    ->with('entradas')
                                    ->lockForUpdate()
                                    ->find($venta->id);

                                if (! $ventaBloqueada) {
                                    return;
                                }

                                if (
                                    $ventaBloqueada->origen
                                    !== 'COMPRA_WEB'
                                ) {
                                    return;
                                }

                                if (
                                    $ventaBloqueada->estado
                                    !== 'PENDIENTE'
                                ) {
                                    return;
                                }

                                $funcionAsientoIds = $ventaBloqueada
                                    ->entradas
                                    ->pluck('funcion_asiento_id');

                                $tieneBloqueoVencido =
                                    FuncionAsiento::query()
                                        ->whereIn(
                                            'id',
                                            $funcionAsientoIds
                                        )
                                        ->where(
                                            'estado',
                                            'BLOQUEADO'
                                        )
                                        ->whereNotNull(
                                            'bloqueado_hasta'
                                        )
                                        ->where(
                                            'bloqueado_hasta',
                                            '<=',
                                            now()
                                        )
                                        ->exists();

                                if (! $tieneBloqueoVencido) {
                                    return;
                                }

                                $ventaBloqueada
                                    ->entradas()
                                    ->where(
                                        'estado',
                                        'PENDIENTE'
                                    )
                                    ->update([
                                        'estado' =>
                                            'CANCELADA',
                                        'cancelada_en' =>
                                            now(),
                                    ]);

                                $liberados =
                                    FuncionAsiento::query()
                                        ->whereIn(
                                            'id',
                                            $funcionAsientoIds
                                        )
                                        ->where(
                                            'estado',
                                            'BLOQUEADO'
                                        )
                                        ->where(
                                            'bloqueado_hasta',
                                            '<=',
                                            now()
                                        )
                                        ->update([
                                            'estado' =>
                                                'DISPONIBLE',
                                            'bloqueado_hasta' =>
                                                null,
                                        ]);

                                $ventaBloqueada->update([
                                    'estado' =>
                                        'CANCELADA',
                                    'cancelada_en' =>
                                        now(),
                                    'motivo_cancelacion' =>
                                        'Tiempo de pago en línea vencido.',
                                ]);

                                $ventasCanceladas++;
                                $asientosLiberados +=
                                    $liberados;
                            },
                            3
                        );
                    }
                }
            );

        $this->info(
            "Ventas canceladas: {$ventasCanceladas}. " .
            "Asientos liberados: {$asientosLiberados}."
        );

        return self::SUCCESS;
    }
}