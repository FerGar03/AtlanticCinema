<?php

namespace App\Services;

use App\Models\Entrada;
use App\Models\Reserva;
use App\Models\Venta;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class VentaService
{
    /**
     * Convierte una reserva pendiente en una venta.
     */
    public function crearDesdeReserva(
        int $reservaId,
        ?int $empleadoId = null
    ): Venta {
        return DB::transaction(function () use ($reservaId, $empleadoId): Venta {
            $reserva = Reserva::query()
                ->with([
                    'detalles.funcionAsiento',
                    'usuario',
                    'funcion',
                ])
                ->lockForUpdate()
                ->findOrFail($reservaId);

            $this->validarReservaConvertible($reserva);

            $funcionAsientoIds = $reserva->detalles
                ->pluck('funcion_asiento_id')
                ->all();

            $asientos = $reserva->detalles
                ->map(fn ($detalle) => $detalle->funcionAsiento)
                ->filter()
                ->values();

            if ($asientos->count() !== count($funcionAsientoIds)) {
                throw ValidationException::withMessages([
                    'reserva_id' => [
                        'No fue posible recuperar todos los asientos de la reserva.',
                    ],
                ]);
            }

            foreach ($asientos as $funcionAsiento) {
                $funcionAsiento->refresh();

                if ($funcionAsiento->estado !== 'RESERVADO') {
                    throw ValidationException::withMessages([
                        'reserva_id' => [
                            'Uno o más asientos de la reserva ya no están reservados.',
                        ],
                    ]);
                }
            }

            $ahora = now();

            $venta = Venta::create([
                'numero_venta' => $this->generarNumeroVenta(),
                'cliente_id' => $reserva->usuario_id,
                'empleado_id' => $empleadoId,
                'reserva_id' => $reserva->id,
                'funcion_id' => $reserva->funcion_id,
                'origen' => 'RESERVA',
                'subtotal' => $reserva->subtotal,
                'descuento' => $reserva->descuento,
                'total' => $reserva->total,
                'estado' => 'PENDIENTE',
                'realizada_en' => $ahora,
                'pagada_en' => null,
                'cancelada_en' => null,
                'motivo_cancelacion' => null,
            ]);

            foreach ($reserva->detalles as $detalle) {
                Entrada::create([
                    'venta_id' => $venta->id,
                    'funcion_asiento_id' => $detalle->funcion_asiento_id,
                    'codigo' => $this->generarCodigoEntrada(),
                    'precio' => $detalle->precio,
                    'estado' => 'PENDIENTE',
                    'emitida_en' => $ahora,
                    'utilizada_en' => null,
                    'cancelada_en' => null,
                    'reembolsada_en' => null,
                ]);

                $detalle->update([
                    'estado' => 'CONVERTIDO',
                ]);

                $detalle->funcionAsiento->update([
                    'estado' => 'VENDIDO',
                    'bloqueado_hasta' => null,
                ]);
            }

            $reserva->update([
                'estado' => 'CONVERTIDA',
                'convertida_en' => $ahora,
            ]);

            return $venta->load([
                'cliente',
                'empleado',
                'reserva',
                'funcion',
                'entradas.funcionAsiento.asiento',
            ]);
        }, 3);
    }

    /**
     * Valida que la reserva pueda convertirse en venta.
     */
    private function validarReservaConvertible(Reserva $reserva): void
    {
        if ($reserva->estado !== 'PENDIENTE') {
            throw ValidationException::withMessages([
                'reserva_id' => [
                    'La reserva no se encuentra en estado PENDIENTE.',
                ],
            ]);
        }

        if ($reserva->expira_en->isPast()) {
            throw ValidationException::withMessages([
                'reserva_id' => [
                    'La reserva ha expirado y ya no puede convertirse en venta.',
                ],
            ]);
        }

        if ($reserva->detalles->isEmpty()) {
            throw ValidationException::withMessages([
                'reserva_id' => [
                    'La reserva no contiene asientos.',
                ],
            ]);
        }

        if ($reserva->venta()->exists()) {
            throw ValidationException::withMessages([
                'reserva_id' => [
                    'La reserva ya fue convertida en una venta.',
                ],
            ]);
        }
    }

    /**
     * Genera un número único para la venta.
     */
    private function generarNumeroVenta(): string
    {
        do {
            $numero = 'VEN-' . strtoupper(Str::random(12));
        } while (
            Venta::query()
                ->where('numero_venta', $numero)
                ->exists()
        );

        return $numero;
    }

    /**
     * Genera un código único para una entrada.
     */
    private function generarCodigoEntrada(): string
    {
        do {
            $codigo = 'ENT-' . strtoupper(Str::random(16));
        } while (
            Entrada::query()
                ->where('codigo', $codigo)
                ->exists()
        );

        return $codigo;
    }
}