<?php

namespace App\Services;

use App\Contracts\ProveedorPagoInterface;
use App\Models\FuncionAsiento;
use App\Models\MetodoPago;
use App\Models\Pago;
use App\Models\Venta;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PagoService
{
    public function __construct(
        private readonly ProveedorPagoInterface $proveedorPago
    ) {
    }

    public function registrar(array $datos): Pago
    {
        $contexto = DB::transaction(function () use ($datos) {
            $venta = Venta::query()
                ->with('entradas')
                ->lockForUpdate()
                ->findOrFail($datos['venta_id']);

            $metodoPago = MetodoPago::query()
                ->whereKey($datos['metodo_pago_id'])
                ->where('estado', 'ACTIVO')
                ->first();

            if (! $metodoPago) {
                throw ValidationException::withMessages([
                    'metodo_pago_id' =>
                        'El método de pago no existe o está inactivo.',
                ]);
            }

            $this->validarVenta($venta);

            $this->validarVigenciaCompraWeb($venta);

            $pagoAprobadoExistente = Pago::query()
                ->where('venta_id', $venta->id)
                ->where('estado', 'APROBADO')
                ->exists();

            if ($pagoAprobadoExistente) {
                throw ValidationException::withMessages([
                    'venta_id' =>
                        'La venta ya posee un pago aprobado.',
                ]);
            }

            if ($metodoPago->codigo === 'EFECTIVO') {
                $pago = $this->registrarPagoEfectivo(
                    $venta,
                    $metodoPago,
                    $datos
                );

                $this->marcarVentaComoPagada($venta);

                return [
                    'tipo' => 'EFECTIVO',
                    'pago' => $pago,
                    'venta' => $venta,
                    'metodo_pago' => $metodoPago,
                ];
            }

            $pago = Pago::query()->create([
                'venta_id' => $venta->id,
                'metodo_pago_id' => $metodoPago->id,
                'proveedor' => 'PENDIENTE',
                'referencia_proveedor' => null,
                'monto' => $venta->total,
                'moneda' => 'GTQ',
                'estado' => 'PENDIENTE',
                'autorizacion_codigo' => null,
                'aprobado_en' => null,
                'descripcion' =>
                    $datos['descripcion'] ?? null,
            ]);

            return [
                'tipo' => 'EXTERNO',
                'pago' => $pago,
                'venta' => $venta,
                'metodo_pago' => $metodoPago,
            ];
        });

        if ($contexto['tipo'] === 'EFECTIVO') {
            return $contexto['pago']->load([
                'venta.entradas',
                'metodoPago',
            ]);
        }

        return $this->procesarPagoExterno(
            $contexto['pago'],
            $contexto['venta'],
            $contexto['metodo_pago']
        );
    }

    public function confirmarSimulado(
        Pago $pago,
        string $resultado
    ): Pago {
        return DB::transaction(
            function () use ($pago, $resultado) {
                $pagoBloqueado = Pago::query()
                    ->lockForUpdate()
                    ->findOrFail($pago->id);

                $venta = Venta::query()
                    ->with('entradas')
                    ->lockForUpdate()
                    ->findOrFail(
                        $pagoBloqueado->venta_id
                    );

                $this->validarVigenciaCompraWeb(
                    $venta
                );

                if (
                    $pagoBloqueado->proveedor
                    !== 'SIMULADOR'
                ) {
                    throw ValidationException::withMessages([
                        'pago' =>
                            'El pago no pertenece al proveedor simulado.',
                    ]);
                }

                if (
                    $pagoBloqueado->estado
                    !== 'PENDIENTE'
                ) {
                    throw ValidationException::withMessages([
                        'pago' =>
                            'El pago ya fue procesado anteriormente.',
                    ]);
                }

                $estado =
                    $resultado === 'APROBADO'
                        ? 'APROBADO'
                        : 'RECHAZADO';

                $pagoBloqueado->update([
                    'estado' => $estado,

                    'autorizacion_codigo' =>
                        $estado === 'APROBADO'
                            ? 'SIM-AUTH-' .
                                strtoupper(
                                    bin2hex(
                                        random_bytes(6)
                                    )
                                )
                            : null,

                    'aprobado_en' =>
                        $estado === 'APROBADO'
                            ? now()
                            : null,

                    'descripcion' =>
                        $estado === 'APROBADO'
                            ? 'Pago aprobado por el simulador.'
                            : 'Pago rechazado por el simulador.',
                ]);

                if ($estado === 'APROBADO') {
                    $this->marcarVentaComoPagada(
                        $venta
                    );
                } elseif (
                    $venta->origen === 'COMPRA_WEB'
                ) {
                    $this->marcarCompraWebComoFallida(
                        $venta
                    );
                }

                return $pagoBloqueado->load([
                    'venta.entradas',
                    'metodoPago',
                ]);
            },
            3
        );
    }

    private function procesarPagoExterno(
        Pago $pago,
        Venta $venta,
        MetodoPago $metodoPago
    ): Pago {
        try {
            $respuesta = $this
                ->proveedorPago
                ->procesar(
                    $venta,
                    $metodoPago
                );

            return DB::transaction(
                function () use (
                    $pago,
                    $respuesta
                ) {
                    $pagoBloqueado = Pago::query()
                        ->lockForUpdate()
                        ->findOrFail(
                            $pago->id
                        );

                    $ventaBloqueada = Venta::query()
                        ->with('entradas')
                        ->lockForUpdate()
                        ->findOrFail(
                            $pagoBloqueado
                                ->venta_id
                        );

                    $pagoBloqueado->update([
                        'proveedor' =>
                            $respuesta['proveedor'],

                        'referencia_proveedor' =>
                            $respuesta[
                                'referencia_proveedor'
                            ],

                        'estado' =>
                            $respuesta['estado'],

                        'autorizacion_codigo' =>
                            $respuesta[
                                'autorizacion_codigo'
                            ],

                        'aprobado_en' =>
                            $respuesta['estado']
                                === 'APROBADO'
                                ? now()
                                : null,

                        'descripcion' =>
                            $respuesta[
                                'descripcion'
                            ] ??
                            $pagoBloqueado
                                ->descripcion,
                    ]);

                    if (
                        $respuesta['estado']
                        === 'APROBADO'
                    ) {
                        $this
                            ->marcarVentaComoPagada(
                                $ventaBloqueada
                            );
                    } elseif (
                        $respuesta['estado']
                            === 'RECHAZADO'
                        && $ventaBloqueada
                            ->origen
                            === 'COMPRA_WEB'
                    ) {
                        $this
                            ->marcarCompraWebComoFallida(
                                $ventaBloqueada
                            );
                    }

                    $pagoBloqueado->setAttribute(
                        'client_secret',
                        $respuesta[
                            'client_secret'
                        ] ?? null
                    );

                    return $pagoBloqueado->load([
                        'venta.entradas',
                        'metodoPago',
                    ]);
                },
                3
            );
        } catch (\Throwable $exception) {
            DB::transaction(function () use (
                $pago,
                $exception
            ) {
                $pagoBloqueado = Pago::query()
                    ->with('venta.entradas')
                    ->lockForUpdate()
                    ->find($pago->id);

                if (! $pagoBloqueado) {
                    return;
                }

                if (
                    $pagoBloqueado->estado
                    !== 'PENDIENTE'
                ) {
                    return;
                }

                $pagoBloqueado->update([
                    'estado' => 'RECHAZADO',
                    'descripcion' =>
                        $exception->getMessage(),
                ]);

                $venta = $pagoBloqueado->venta;

                if (
                    $venta
                    && $venta->origen
                        === 'COMPRA_WEB'
                    && $venta->estado
                        === 'PENDIENTE'
                ) {
                    $this
                        ->marcarCompraWebComoFallida(
                            $venta
                        );
                }
            });

            throw ValidationException::withMessages([
                'pago' =>
                    'No fue posible procesar el pago con el proveedor externo.',
            ]);
        }
    }

    private function registrarPagoEfectivo(
        Venta $venta,
        MetodoPago $metodoPago,
        array $datos
    ): Pago {
        return Pago::query()->create([
            'venta_id' => $venta->id,
            'metodo_pago_id' =>
                $metodoPago->id,
            'proveedor' => 'TAQUILLA',
            'referencia_proveedor' => null,
            'monto' => $venta->total,
            'moneda' => 'GTQ',
            'estado' => 'APROBADO',
            'autorizacion_codigo' => null,
            'aprobado_en' => now(),
            'descripcion' =>
                $datos['descripcion']
                ?? 'Pago en efectivo registrado en taquilla.',
        ]);
    }

    private function marcarVentaComoPagada(
        Venta $venta
    ): void {
        $venta->update([
            'estado' => 'PAGADA',
            'pagada_en' => now(),
        ]);

        $venta->entradas()->update([
            'estado' => 'VALIDA',
        ]);

        if ($venta->origen === 'COMPRA_WEB') {
            $funcionAsientoIds = $venta
                ->entradas()
                ->pluck(
                    'funcion_asiento_id'
                );

            FuncionAsiento::query()
                ->whereIn(
                    'id',
                    $funcionAsientoIds
                )
                ->where(
                    'estado',
                    'BLOQUEADO'
                )
                ->update([
                    'estado' => 'VENDIDO',
                    'bloqueado_hasta' => null,
                ]);
        }
    }

    private function marcarCompraWebComoFallida(
        Venta $venta
    ): void {
        $funcionAsientoIds = $venta
            ->entradas()
            ->pluck(
                'funcion_asiento_id'
            );

        $venta->entradas()->update([
            'estado' => 'CANCELADA',
            'cancelada_en' => now(),
        ]);

        FuncionAsiento::query()
            ->whereIn(
                'id',
                $funcionAsientoIds
            )
            ->where(
                'estado',
                'BLOQUEADO'
            )
            ->update([
                'estado' => 'DISPONIBLE',
                'bloqueado_hasta' => null,
            ]);

        $venta->update([
            'estado' => 'FALLIDA',
        ]);
    }

    private function validarVigenciaCompraWeb(
        Venta $venta
    ): void {
        if ($venta->origen !== 'COMPRA_WEB') {
            return;
        }

        $funcionAsientoIds = $venta
            ->entradas()
            ->pluck(
                'funcion_asiento_id'
            );

        $asientos = FuncionAsiento::query()
            ->whereIn(
                'id',
                $funcionAsientoIds
            )
            ->get();

        if ($asientos->isEmpty()) {
            throw ValidationException::withMessages([
                'venta_id' =>
                    'No fue posible verificar los asientos de la compra.',
            ]);
        }

        $bloqueoInvalido = $asientos->contains(
            function (
                FuncionAsiento $asiento
            ): bool {
                return
                    $asiento->estado
                        !== 'BLOQUEADO'
                    || $asiento->bloqueado_hasta
                        === null
                    || $asiento
                        ->bloqueado_hasta
                        ->isPast();
            }
        );

        if ($bloqueoInvalido) {
            throw ValidationException::withMessages([
                'venta_id' =>
                    'El tiempo disponible para completar esta compra ha vencido.',
            ]);
        }
    }

    private function validarVenta(
        Venta $venta
    ): void {
        if ($venta->estado === 'PAGADA') {
            throw ValidationException::withMessages([
                'venta_id' =>
                    'La venta ya se encuentra pagada.',
            ]);
        }

        if ($venta->estado === 'CANCELADA') {
            throw ValidationException::withMessages([
                'venta_id' =>
                    'No se puede registrar un pago para una venta cancelada.',
            ]);
        }

        if ($venta->estado !== 'PENDIENTE') {
            throw ValidationException::withMessages([
                'venta_id' =>
                    'La venta no se encuentra disponible para recibir pagos.',
            ]);
        }
    }
}