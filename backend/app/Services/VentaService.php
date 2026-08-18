<?php

namespace App\Services;

use App\Models\Entrada;
use App\Models\Funcion;
use App\Models\FuncionAsiento;
use App\Models\Reserva;
use App\Models\Venta;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class VentaService
{
    /**
     * Crea una compra directa realizada desde la web.
     */
    public function crearDirecta(
        int $clienteId,
        int $funcionId,
        array $funcionAsientoIds
    ): Venta {
        return DB::transaction(function () use (
            $clienteId,
            $funcionId,
            $funcionAsientoIds
        ): Venta {
            $funcion = Funcion::query()
                ->lockForUpdate()
                ->findOrFail($funcionId);

            if ($funcion->estado !== 'PROGRAMADA') {
                throw ValidationException::withMessages([
                    'funcion_id' => [
                        'La función no está disponible para compras.',
                    ],
                ]);
            }

            if ($funcion->inicia_en->isPast()) {
                throw ValidationException::withMessages([
                    'funcion_id' => [
                        'No es posible comprar entradas para una función que ya inició.',
                    ],
                ]);
            }

            $ids = collect($funcionAsientoIds)
                ->map(fn ($id): int => (int) $id)
                ->unique()
                ->values();

            if ($ids->isEmpty()) {
                throw ValidationException::withMessages([
                    'funcion_asiento_ids' => [
                        'Debe seleccionar al menos un asiento.',
                    ],
                ]);
            }

            if ($ids->count() > 5) {
                throw ValidationException::withMessages([
                    'funcion_asiento_ids' => [
                        'Solo se pueden comprar hasta cinco asientos por operación.',
                    ],
                ]);
            }

            $asientos = FuncionAsiento::query()
                ->where('funcion_id', $funcion->id)
                ->whereIn('id', $ids)
                ->lockForUpdate()
                ->get();

            if ($asientos->count() !== $ids->count()) {
                throw ValidationException::withMessages([
                    'funcion_asiento_ids' => [
                        'Uno o más asientos no pertenecen a la función seleccionada.',
                    ],
                ]);
            }

            $noDisponibles = $asientos
                ->where('estado', '!=', 'DISPONIBLE');

            if ($noDisponibles->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'funcion_asiento_ids' => [
                        'Uno o más asientos seleccionados ya no están disponibles.',
                    ],
                ]);
            }

            $subtotal = round(
                (float) $asientos->sum(
                    fn (FuncionAsiento $asiento): float =>
                        (float) $asiento->precio
                ),
                2
            );

            $descuento = 0.00;
            $total = $subtotal;

            $ahora = now();

            $bloqueadoHasta = $ahora
                ->copy()
                ->addMinutes(
                    config('compras.minutos_pago', 10)
                );

            $venta = Venta::query()->create([
                'numero_venta' => $this->generarNumeroVenta(),
                'cliente_id' => $clienteId,
                'empleado_id' => null,
                'reserva_id' => null,
                'funcion_id' => $funcion->id,
                'origen' => 'COMPRA_WEB',
                'subtotal' => $subtotal,
                'descuento' => $descuento,
                'total' => $total,
                'estado' => 'PENDIENTE',
                'realizada_en' => $ahora,
                'pagada_en' => null,
                'cancelada_en' => null,
                'motivo_cancelacion' => null,
            ]);

            foreach ($asientos as $funcionAsiento) {
                Entrada::query()->create([
                    'venta_id' => $venta->id,
                    'funcion_asiento_id' => $funcionAsiento->id,
                    'codigo' => $this->generarCodigoEntrada(),
                    'precio' => $funcionAsiento->precio,
                    'estado' => 'PENDIENTE',
                    'emitida_en' => $ahora,
                    'utilizada_en' => null,
                    'cancelada_en' => null,
                    'reembolsada_en' => null,
                ]);

                $funcionAsiento->update([
                    'estado' => 'BLOQUEADO',
                    'bloqueado_hasta' => $bloqueadoHasta,
                ]);
            }

            return $venta->load([
                'cliente',
                'funcion.pelicula',
                'funcion.sala',
                'funcion.formato',
                'entradas.funcionAsiento.asiento',
            ]);
        }, 3);
    }

    /**
     * Convierte una reserva pendiente en una venta.
     */
    public function crearDesdeReserva(
        int $reservaId,
        ?int $empleadoId = null
    ): Venta {
        return DB::transaction(function () use (
            $reservaId,
            $empleadoId
        ): Venta {
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

            $venta = Venta::query()->create([
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
                Entrada::query()->create([
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

    private function validarReservaConvertible(
        Reserva $reserva
    ): void {
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
                    'La reserva ha vencido y ya no puede convertirse en venta.',
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

    private function generarNumeroVenta(): string
    {
        do {
            $numero = 'VEN-' . strtoupper(
                Str::random(12)
            );
        } while (
            Venta::query()
                ->where('numero_venta', $numero)
                ->exists()
        );

        return $numero;
    }

    private function generarCodigoEntrada(): string
    {
        do {
            $codigo = 'ENT-' . strtoupper(
                Str::random(16)
            );
        } while (
            Entrada::query()
                ->where('codigo', $codigo)
                ->exists()
        );

        return $codigo;
    }
}