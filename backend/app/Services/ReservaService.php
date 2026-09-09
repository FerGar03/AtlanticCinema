<?php

namespace App\Services;

use App\Models\Funcion;
use App\Models\FuncionAsiento;
use App\Models\Reserva;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ReservaService
{
    /**
     * Crea una reserva y bloquea sus asientos dentro de una transacción.
     *
     * @throws ValidationException
     */
    public function crear(array $datos): Reserva
    {
        return DB::transaction(function () use ($datos): Reserva {
            $funcion = Funcion::query()
                ->lockForUpdate()
                ->find($datos['funcion_id']);

            if (! $funcion) {
                throw ValidationException::withMessages([
                    'funcion_id' => [
                        'La función seleccionada no existe.',
                    ],
                ]);
            }

            if ($funcion->estado !== 'PROGRAMADA') {
                throw ValidationException::withMessages([
                    'funcion_id' => [
                        'La función seleccionada no está disponible para reservas.',
                    ],
                ]);
            }

            if ($funcion->inicia_en->isPast()) {
                throw ValidationException::withMessages([
                    'funcion_id' => [
                        'No es posible reservar asientos para una función que ya inició.',
                    ],
                ]);
            }

            $minutosAntesFuncion = config(
                'reservas.minutos_antes_funcion',
                30
            );

            $horasExpiracion = config(
                'reservas.horas_expiracion',
                2
            );

            $limiteAntesFuncion = $funcion->inicia_en
                ->copy()
                ->subMinutes($minutosAntesFuncion);

            if (now()->gte($limiteAntesFuncion)) {
                throw ValidationException::withMessages([
                    'funcion_id' => [
                        "Las reservas en línea cierran {$minutosAntesFuncion} minutos antes del inicio de la función.",
                    ],
                ]);
            }

            $funcionAsientoIds = collect(
                $datos['funcion_asiento_ids']
            )
                ->map(fn ($id): int => (int) $id)
                ->unique()
                ->values();

            if ($funcionAsientoIds->isEmpty()) {
                throw ValidationException::withMessages([
                    'funcion_asiento_ids' => [
                        'Debe seleccionar al menos un asiento.',
                    ],
                ]);
            }

            if ($funcionAsientoIds->count() > 5) {
                throw ValidationException::withMessages([
                    'funcion_asiento_ids' => [
                        'Solo se pueden reservar hasta cinco asientos por operación.',
                    ],
                ]);
            }

            $funcionAsientos = FuncionAsiento::query()
                ->where('funcion_id', $funcion->id)
                ->whereIn('id', $funcionAsientoIds)
                ->lockForUpdate()
                ->get();

            $this->validarAsientosSolicitados(
                $funcionAsientoIds,
                $funcionAsientos
            );

            $subtotal = $funcionAsientos->sum(
                fn (FuncionAsiento $funcionAsiento): float =>
                    (float) $funcionAsiento->precio
            );

            $descuento = round(
                (float) ($datos['descuento'] ?? 0),
                2
            );

            if ($descuento < 0) {
                throw ValidationException::withMessages([
                    'descuento' => [
                        'El descuento no puede ser negativo.',
                    ],
                ]);
            }

            if ($descuento > $subtotal) {
                throw ValidationException::withMessages([
                    'descuento' => [
                        'El descuento no puede ser mayor que el subtotal.',
                    ],
                ]);
            }

            $subtotal = round($subtotal, 2);
            $total = round($subtotal - $descuento, 2);

            $reservadaEn = now();

            $expiraPorTiempo = $reservadaEn
                ->copy()
                ->addHours($horasExpiracion);

            $expiraEn = $expiraPorTiempo->lte(
                $limiteAntesFuncion
            )
                ? $expiraPorTiempo
                : $limiteAntesFuncion;

            $reserva = Reserva::create([
                'codigo' => $this->generarCodigo(),
                'usuario_id' => $datos['usuario_id'],
                'funcion_id' => $funcion->id,
                'cantidad_entradas' => $funcionAsientos->count(),
                'subtotal' => $subtotal,
                'descuento' => $descuento,
                'total' => $total,
                'estado' => 'PENDIENTE',
                'reservada_en' => $reservadaEn,
                'expira_en' => $expiraEn,
            ]);

            foreach ($funcionAsientos as $funcionAsiento) {
                $reserva->detalles()->create([
                    'funcion_asiento_id' => $funcionAsiento->id,
                    'precio' => $funcionAsiento->precio,
                    'estado' => 'RESERVADO',
                ]);

                $funcionAsiento->update([
                    'estado' => 'RESERVADO',
                    'bloqueado_hasta' => $expiraEn,
                ]);
            }

            return $reserva->load([
                'usuario.rol',
                'funcion.pelicula',
                'funcion.sala',
                'funcion.formato',
                'detalles.funcionAsiento.asiento',
            ]);
        }, 3);
    }

    /**
     * Cancela una reserva pendiente y libera sus asientos.
     *
     * @throws ValidationException
     */
    public function cancelar(
        Reserva $reserva,
        string $motivo
    ): Reserva {
        return DB::transaction(
            function () use (
                $reserva,
                $motivo
            ): Reserva {
                $reserva = Reserva::query()
                    ->with([
                        'detalles.funcionAsiento',
                    ])
                    ->lockForUpdate()
                    ->findOrFail($reserva->id);

                if ($reserva->estado !== 'PENDIENTE') {
                    throw ValidationException::withMessages([
                        'reserva' => [
                            'Solo se pueden cancelar reservas en estado PENDIENTE.',
                        ],
                    ]);
                }

                if ($reserva->venta()->exists()) {
                    throw ValidationException::withMessages([
                        'reserva' => [
                            'La reserva ya fue convertida en una venta y no puede cancelarse.',
                        ],
                    ]);
                }

                foreach ($reserva->detalles as $detalle) {
                    if ($detalle->estado === 'RESERVADO') {
                        $detalle->update([
                            'estado' => 'LIBERADO',
                        ]);
                    }

                    $funcionAsiento =
                        $detalle->funcionAsiento;

                    if (
                        $funcionAsiento
                        && $funcionAsiento->estado === 'RESERVADO'
                    ) {
                        $funcionAsiento->update([
                            'estado' => 'DISPONIBLE',
                            'bloqueado_hasta' => null,
                        ]);
                    }
                }

                $reserva->update([
                    'estado' => 'CANCELADA',
                    'cancelada_en' => now(),
                    'motivo_cancelacion' => trim($motivo),
                ]);

                return $reserva
                    ->refresh()
                    ->load([
                        'usuario.rol',
                        'funcion.pelicula',
                        'funcion.sala',
                        'funcion.formato',
                        'detalles.funcionAsiento.asiento',
                        'venta',
                    ]);
            },
            3
        );
    }

    /**
     * Verifica que los asientos existan, pertenezcan a la función
     * y se encuentren disponibles.
     */
    private function validarAsientosSolicitados(
        Collection $funcionAsientoIds,
        Collection $funcionAsientos
    ): void {
        if (
            $funcionAsientos->count()
            !== $funcionAsientoIds->count()
        ) {
            throw ValidationException::withMessages([
                'funcion_asiento_ids' => [
                    'Uno o más asientos no existen o no pertenecen a la función seleccionada.',
                ],
            ]);
        }

        $asientosNoDisponibles = $funcionAsientos
            ->where('estado', '!=', 'DISPONIBLE')
            ->pluck('id')
            ->values();

        if ($asientosNoDisponibles->isNotEmpty()) {
            throw ValidationException::withMessages([
                'funcion_asiento_ids' => [
                    'Uno o más asientos seleccionados ya no están disponibles.',
                ],
            ]);
        }
    }

    /**
     * Genera un código único para identificar la reserva.
     */
    private function generarCodigo(): string
    {
        do {
            $codigo = 'RES-' . strtoupper(
                Str::random(12)
            );
        } while (
            Reserva::query()
                ->where('codigo', $codigo)
                ->exists()
        );

        return $codigo;
    }
}