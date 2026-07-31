<?php

namespace App\Services\Pagos;

use App\Contracts\ProveedorPagoInterface;
use App\Models\MetodoPago;
use App\Models\Venta;
use Illuminate\Support\Str;

class SimuladorPagoService implements ProveedorPagoInterface
{
    public function procesar(
        Venta $venta,
        MetodoPago $metodoPago
    ): array {
        return [
            'proveedor' => 'SIMULADOR',
            'referencia_proveedor' => 'SIM-' . Str::upper(Str::random(20)),
            'estado' => 'APROBADO',
            'autorizacion_codigo' => Str::upper(Str::random(12)),
            'descripcion' => sprintf(
                'Pago simulado para la venta %s mediante %s.',
                $venta->numero_venta,
                $metodoPago->nombre
            ),
        ];
    }
}