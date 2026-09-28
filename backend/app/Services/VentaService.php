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

            $this->validarFuncionDisponible(
                $funcion
            );

            $asientos =
                $this->obtenerAsientosDisponibles(
                    funcion: $funcion,
                    funcionAsientoIds:
                        $funcionAsientoIds,
                );

            $subtotal =
                $this->calcularSubtotal(
                    $asientos
                );

            $descuento = 0.00;
            $total = $subtotal;

            $ahora = now();

            $bloqueadoHasta =
                $ahora
                    ->copy()
                    ->addMinutes(
                        config(
                            'compras.minutos_pago',
                            10
                        )
                    );

            $venta = Venta::query()->create([
                'numero_venta' =>
                    $this->generarNumeroVenta(),

                'cliente_id' =>
                    $clienteId,

                'empleado_id' =>
                    null,

                'reserva_id' =>
                    null,

                'funcion_id' =>
                    $funcion->id,

                'origen' =>
                    'COMPRA_WEB',

                'subtotal' =>
                    $subtotal,

                'descuento' =>
                    $descuento,

                'total' =>
                    $total,

                /*
                 * Toda compra web comienza con
                 * facturación a Consumidor Final.
                 *
                 * Si el cliente proporciona un NIT
                 * antes de pagar, estos datos serán
                 * sustituidos posteriormente.
                 */
                'nit_facturacion' =>
                    'CF',

                'nombre_facturacion' =>
                    'Consumidor Final',

                'estado' =>
                    'PENDIENTE',

                'realizada_en' =>
                    $ahora,

                'pagada_en' =>
                    null,

                'cancelada_en' =>
                    null,

                'motivo_cancelacion' =>
                    null,
            ]);

            $this->crearEntradasYBloquearAsientos(
                venta: $venta,
                asientos: $asientos,
                bloqueadoHasta:
                    $bloqueadoHasta,
                ahora: $ahora,
            );

            return $venta->load([
                'cliente',
                'empleado',
                'funcion.pelicula',
                'funcion.sala',
                'funcion.formato',
                'entradas.funcionAsiento.asiento',
            ]);
        }, 3);
    }

    /**
     * Crea una venta directa presencial
     * realizada por personal de taquilla.
     *
     * La venta se crea PENDIENTE y los
     * asientos quedan temporalmente
     * BLOQUEADOS hasta registrar el pago.
     */
    public function crearTaquilla(
        int $empleadoId,
        int $funcionId,
        array $funcionAsientoIds,
        ?int $clienteId = null
    ): Venta {
        return DB::transaction(function () use (
            $empleadoId,
            $funcionId,
            $funcionAsientoIds,
            $clienteId
        ): Venta {
            $funcion = Funcion::query()
                ->lockForUpdate()
                ->findOrFail($funcionId);

            $this->validarFuncionDisponible(
                $funcion
            );

            $asientos =
                $this->obtenerAsientosDisponibles(
                    funcion: $funcion,
                    funcionAsientoIds:
                        $funcionAsientoIds,
                );

            $subtotal =
                $this->calcularSubtotal(
                    $asientos
                );

            $descuento = 0.00;
            $total = $subtotal;

            $ahora = now();

            /*
             * Aunque el cobro presencial debe ser
             * prácticamente inmediato, bloqueamos
             * los asientos mientras el empleado
             * registra efectivo o tarjeta POS.
             */
            $bloqueadoHasta =
                $ahora
                    ->copy()
                    ->addMinutes(
                        config(
                            'compras.minutos_pago',
                            10
                        )
                    );

            $venta = Venta::query()->create([
                'numero_venta' =>
                    $this->generarNumeroVenta(),

                'cliente_id' =>
                    $clienteId,

                'empleado_id' =>
                    $empleadoId,

                'reserva_id' =>
                    null,

                'funcion_id' =>
                    $funcion->id,

                'origen' =>
                    'TAQUILLA',

                'subtotal' =>
                    $subtotal,

                'descuento' =>
                    $descuento,

                'total' =>
                    $total,

                'estado' =>
                    'PENDIENTE',

                'realizada_en' =>
                    $ahora,

                'pagada_en' =>
                    null,

                'cancelada_en' =>
                    null,

                'motivo_cancelacion' =>
                    null,
            ]);

            $this->crearEntradasYBloquearAsientos(
                venta: $venta,
                asientos: $asientos,
                bloqueadoHasta:
                    $bloqueadoHasta,
                ahora: $ahora,
            );

            return $venta->load([
                'cliente',
                'empleado',
                'funcion.pelicula',
                'funcion.sala',
                'funcion.formato',
                'entradas.funcionAsiento.asiento',
            ]);
        }, 3);
    }

    /**
     * Convierte una reserva pendiente en venta.
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

            $this->validarReservaConvertible(
                $reserva
            );

            $funcionAsientoIds =
                $reserva
                    ->detalles
                    ->pluck(
                        'funcion_asiento_id'
                    )
                    ->all();

            $asientos =
                $reserva
                    ->detalles
                    ->map(
                        fn ($detalle) =>
                            $detalle
                                ->funcionAsiento
                    )
                    ->filter()
                    ->values();

            if (
                $asientos->count()
                !== count(
                    $funcionAsientoIds
                )
            ) {
                throw ValidationException::withMessages([
                    'reserva_id' => [
                        'No fue posible recuperar todos los asientos de la reserva.',
                    ],
                ]);
            }

            foreach (
                $asientos
                as $funcionAsiento
            ) {
                $funcionAsiento->refresh();

                if (
                    $funcionAsiento->estado
                    !== 'RESERVADO'
                ) {
                    throw ValidationException::withMessages([
                        'reserva_id' => [
                            'Uno o más asientos de la reserva ya no están reservados.',
                        ],
                    ]);
                }
            }

            $ahora = now();

            $venta = Venta::query()->create([
                'numero_venta' =>
                    $this->generarNumeroVenta(),

                'cliente_id' =>
                    $reserva->usuario_id,

                'empleado_id' =>
                    $empleadoId,

                'reserva_id' =>
                    $reserva->id,

                'funcion_id' =>
                    $reserva->funcion_id,

                'origen' =>
                    'RESERVA',

                'subtotal' =>
                    $reserva->subtotal,

                'descuento' =>
                    $reserva->descuento,

                'total' =>
                    $reserva->total,

                'estado' =>
                    'PENDIENTE',

                'realizada_en' =>
                    $ahora,

                'pagada_en' =>
                    null,

                'cancelada_en' =>
                    null,

                'motivo_cancelacion' =>
                    null,
            ]);

            foreach (
                $reserva->detalles
                as $detalle
            ) {
                Entrada::query()->create([
                    'venta_id' =>
                        $venta->id,

                    'funcion_asiento_id' =>
                        $detalle
                            ->funcion_asiento_id,

                    'codigo' =>
                        $this->generarCodigoEntrada(),

                    'precio' =>
                        $detalle->precio,

                    'estado' =>
                        'PENDIENTE',

                    'emitida_en' =>
                        $ahora,

                    'utilizada_en' =>
                        null,

                    'cancelada_en' =>
                        null,

                    'reembolsada_en' =>
                        null,
                ]);

                $detalle->update([
                    'estado' =>
                        'CONVERTIDO',
                ]);

                $detalle
                    ->funcionAsiento
                    ->update([
                        'estado' =>
                            'VENDIDO',

                        'bloqueado_hasta' =>
                            null,
                    ]);
            }

            $reserva->update([
                'estado' =>
                    'CONVERTIDA',

                'convertida_en' =>
                    $ahora,
            ]);

            return $venta->load([
                'cliente',
                'empleado',
                'reserva',
                'funcion.pelicula',
                'funcion.sala',
                'funcion.formato',
                'entradas.funcionAsiento.asiento',
            ]);
        }, 3);
    }

    /**
     * Comprueba que la función todavía
     * admita ventas.
     */
    private function validarFuncionDisponible(
        Funcion $funcion
    ): void {
        if (
            $funcion->estado
            !== 'PROGRAMADA'
        ) {
            throw ValidationException::withMessages([
                'funcion_id' => [
                    'La función no está disponible para compras.',
                ],
            ]);
        }

        if (
            $funcion->inicia_en
                ->isPast()
        ) {
            throw ValidationException::withMessages([
                'funcion_id' => [
                    'No es posible comprar entradas para una función que ya inició.',
                ],
            ]);
        }
    }

    /**
     * Recupera y bloquea para modificación
     * los asientos solicitados.
     */
    private function obtenerAsientosDisponibles(
        Funcion $funcion,
        array $funcionAsientoIds
    ) {
        $ids =
            collect(
                $funcionAsientoIds
            )
                ->map(
                    fn ($id): int =>
                        (int) $id
                )
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

        $asientos =
            FuncionAsiento::query()
                ->where(
                    'funcion_id',
                    $funcion->id
                )
                ->whereIn(
                    'id',
                    $ids
                )
                ->lockForUpdate()
                ->get();

        if (
            $asientos->count()
            !== $ids->count()
        ) {
            throw ValidationException::withMessages([
                'funcion_asiento_ids' => [
                    'Uno o más asientos no pertenecen a la función seleccionada.',
                ],
            ]);
        }

        $noDisponibles =
            $asientos->where(
                'estado',
                '!=',
                'DISPONIBLE'
            );

        if (
            $noDisponibles
                ->isNotEmpty()
        ) {
            throw ValidationException::withMessages([
                'funcion_asiento_ids' => [
                    'Uno o más asientos seleccionados ya no están disponibles.',
                ],
            ]);
        }

        return $asientos;
    }

    /**
     * Calcula el subtotal a partir del
     * precio real de cada asiento de función.
     */
    private function calcularSubtotal(
        $asientos
    ): float {
        return round(
            (float) $asientos->sum(
                fn (
                    FuncionAsiento
                    $asiento
                ): float =>
                    (float)
                    $asiento->precio
            ),
            2
        );
    }

    /**
     * Crea las entradas pendientes y
     * bloquea temporalmente los asientos
     * mientras se completa el pago.
     */
    private function crearEntradasYBloquearAsientos(
        Venta $venta,
        $asientos,
        $bloqueadoHasta,
        $ahora
    ): void {
        foreach (
            $asientos
            as $funcionAsiento
        ) {
            Entrada::query()->create([
                'venta_id' =>
                    $venta->id,

                'funcion_asiento_id' =>
                    $funcionAsiento->id,

                'codigo' =>
                    $this->generarCodigoEntrada(),

                'precio' =>
                    $funcionAsiento->precio,

                'estado' =>
                    'PENDIENTE',

                'emitida_en' =>
                    $ahora,

                'utilizada_en' =>
                    null,

                'cancelada_en' =>
                    null,

                'reembolsada_en' =>
                    null,
            ]);

            $funcionAsiento->update([
                'estado' =>
                    'BLOQUEADO',

                'bloqueado_hasta' =>
                    $bloqueadoHasta,
            ]);
        }
    }

    private function validarReservaConvertible(
        Reserva $reserva
    ): void {
        if (
            $reserva->estado
            !== 'PENDIENTE'
        ) {
            throw ValidationException::withMessages([
                'reserva_id' => [
                    'La reserva no se encuentra en estado PENDIENTE.',
                ],
            ]);
        }

        if (
            $reserva->expira_en
                ->isPast()
        ) {
            throw ValidationException::withMessages([
                'reserva_id' => [
                    'La reserva ha vencido y ya no puede convertirse en venta.',
                ],
            ]);
        }

        if (
            $reserva->detalles
                ->isEmpty()
        ) {
            throw ValidationException::withMessages([
                'reserva_id' => [
                    'La reserva no contiene asientos.',
                ],
            ]);
        }

        if (
            $reserva
                ->venta()
                ->exists()
        ) {
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
            $numero =
                'VEN-'
                . strtoupper(
                    Str::random(12)
                );
        } while (
            Venta::query()
                ->where(
                    'numero_venta',
                    $numero
                )
                ->exists()
        );

        return $numero;
    }

    private function generarCodigoEntrada(): string
    {
        do {
            $codigo =
                'ENT-'
                . strtoupper(
                    Str::random(16)
                );
        } while (
            Entrada::query()
                ->where(
                    'codigo',
                    $codigo
                )
                ->exists()
        );

        return $codigo;
    }
}