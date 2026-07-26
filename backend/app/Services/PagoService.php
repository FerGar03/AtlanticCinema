<?php

namespace App\Services;

use App\Models\MetodoPago;
use App\Models\Pago;
use App\Models\Venta;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PagoService
{
    public function registrar(array $datos): Pago
    {
        return DB::transaction(function () use ($datos) {
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

            if ((float) $datos['monto'] !== (float) $venta->total) {
                throw ValidationException::withMessages([
                    'monto' => 'El monto del pago debe coincidir con el total de la venta.',
                ]);
            }

            $pagoAprobadoExistente = Pago::query()
                ->where('venta_id', $venta->id)
                ->where('estado', 'APROBADO')
                ->exists();

            if ($pagoAprobadoExistente) {
                throw ValidationException::withMessages([
                    'venta_id' => 'La venta ya posee un pago aprobado.',
                ]);
            }

            $estado = $datos['estado'] ?? 'PENDIENTE';

            $pago = Pago::create([
                'venta_id' => $venta->id,
                'metodo_pago_id' => $metodoPago->id,
                'proveedor' => $datos['proveedor'] ?? $this->obtenerProveedor($metodoPago->codigo),
                'referencia_proveedor' => $datos['referencia_proveedor'] ?? null,
                'monto' => $datos['monto'],
                'moneda' => $datos['moneda'] ?? 'GTQ',
                'estado' => $estado,
                'autorizacion_codigo' => $datos['autorizacion_codigo'] ?? null,
                'aprobado_en' => $estado === 'APROBADO' ? now() : null,
                'descripcion' => $datos['descripcion'] ?? null,
            ]);

            if ($estado === 'APROBADO') {
                $venta->update([
                    'estado' => 'PAGADA',
                    'pagada_en' => now(),
                ]);

                $venta->entradas()->update([
                    'estado' => 'VALIDA',
                ]);
            }

            return $pago->load([
                'venta.entradas',
                'metodoPago',
            ]);
        });
    }

    private function obtenerProveedor(string $codigoMetodo): string
    {
        return match ($codigoMetodo) {
            'EFECTIVO' => 'TAQUILLA',
            'TARJETA' => 'STRIPE',
            default => 'OTRO',
        };
    }
}