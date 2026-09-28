<?php

namespace App\Services\Pagos;

use App\Contracts\ProveedorPagoInterface;
use App\Models\MetodoPago;
use App\Models\Pago;
use App\Models\Venta;
use Illuminate\Support\Str;

class SimuladorPagoService implements ProveedorPagoInterface
{
    public function procesar(
        Pago $pago,
        Venta $venta,
        MetodoPago $metodoPago
    ): array {
        $referencia =
            'SIM-PI-' . Str::upper(Str::random(20));

        return [
            'proveedor' => 'SIMULADOR',
            'referencia_proveedor' => $referencia,
            'estado' => 'PENDIENTE',
            'autorizacion_codigo' => null,
            'descripcion' => sprintf(
                'Intento de pago simulado %s creado para la venta %s mediante %s.',
                $pago->id,
                $venta->numero_venta,
                $metodoPago->nombre
            ),
            'client_secret' =>
                'sim_secret_' . Str::random(32),
        ];
    }
}