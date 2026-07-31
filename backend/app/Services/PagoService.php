<?php

namespace App\Services;

use App\Contracts\ProveedorPagoInterface;
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
                    'metodo_pago_id' => 'El método de pago no existe o está inactivo.',
                ]);
            }

            $this->validarVenta($venta);

            $pagoAprobadoExistente = Pago::query()
                ->where('venta_id', $venta->id)
                ->where('estado', 'APROBADO')
                ->exists();

            if ($pagoAprobadoExistente) {
                throw ValidationException::withMessages([
                    'venta_id' => 'La venta ya posee un pago aprobado.',
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

            $pago = Pago::create([
                'venta_id' => $venta->id,
                'metodo_pago_id' => $metodoPago->id,
                'proveedor' => 'PENDIENTE',
                'referencia_proveedor' => null,
                'monto' => $venta->total,
                'moneda' => 'GTQ',
                'estado' => 'PENDIENTE',
                'autorizacion_codigo' => null,
                'aprobado_en' => null,
                'descripcion' => $datos['descripcion'] ?? null,
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

    private function procesarPagoExterno(
        Pago $pago,
        Venta $venta,
        MetodoPago $metodoPago
    ): Pago {
        try {
            $respuesta = $this->proveedorPago->procesar(
                $venta,
                $metodoPago
            );

            return DB::transaction(function () use ($pago, $respuesta) {
                $pagoBloqueado = Pago::query()
                    ->lockForUpdate()
                    ->findOrFail($pago->id);

                $ventaBloqueada = Venta::query()
                    ->with('entradas')
                    ->lockForUpdate()
                    ->findOrFail($pagoBloqueado->venta_id);

                $pagoBloqueado->update([
                    'proveedor' => $respuesta['proveedor'],
                    'referencia_proveedor' => $respuesta['referencia_proveedor'],
                    'estado' => $respuesta['estado'],
                    'autorizacion_codigo' => $respuesta['autorizacion_codigo'],
                    'aprobado_en' => $respuesta['estado'] === 'APROBADO'
                        ? now()
                        : null,
                    'descripcion' => $respuesta['descripcion']
                        ?? $pagoBloqueado->descripcion,
                ]);

                if ($respuesta['estado'] === 'APROBADO') {
                    $this->marcarVentaComoPagada($ventaBloqueada);
                }

                return $pagoBloqueado->load([
                    'venta.entradas',
                    'metodoPago',
                ]);
            });
        } catch (\Throwable $exception) {
            DB::transaction(function () use ($pago, $exception) {
                Pago::query()
                    ->whereKey($pago->id)
                    ->where('estado', 'PENDIENTE')
                    ->update([
                        'estado' => 'RECHAZADO',
                        'descripcion' => $exception->getMessage(),
                    ]);
            });

            throw ValidationException::withMessages([
                'pago' => 'No fue posible procesar el pago con el proveedor externo.',
            ]);
        }
    }

    private function registrarPagoEfectivo(
        Venta $venta,
        MetodoPago $metodoPago,
        array $datos
    ): Pago {
        return Pago::create([
            'venta_id' => $venta->id,
            'metodo_pago_id' => $metodoPago->id,
            'proveedor' => 'TAQUILLA',
            'referencia_proveedor' => null,
            'monto' => $venta->total,
            'moneda' => 'GTQ',
            'estado' => 'APROBADO',
            'autorizacion_codigo' => null,
            'aprobado_en' => now(),
            'descripcion' => $datos['descripcion']
                ?? 'Pago en efectivo registrado en taquilla.',
        ]);
    }

    private function marcarVentaComoPagada(Venta $venta): void
    {
        $venta->update([
            'estado' => 'PAGADA',
            'pagada_en' => now(),
        ]);

        $venta->entradas()->update([
            'estado' => 'VALIDA',
        ]);
    }

    private function validarVenta(Venta $venta): void
    {
        if ($venta->estado === 'PAGADA') {
            throw ValidationException::withMessages([
                'venta_id' => 'La venta ya se encuentra pagada.',
            ]);
        }

        if ($venta->estado === 'CANCELADA') {
            throw ValidationException::withMessages([
                'venta_id' => 'No se puede registrar un pago para una venta cancelada.',
            ]);
        }

        if ($venta->estado !== 'PENDIENTE') {
            throw ValidationException::withMessages([
                'venta_id' => 'La venta no se encuentra disponible para recibir pagos.',
            ]);
        }
    }
}