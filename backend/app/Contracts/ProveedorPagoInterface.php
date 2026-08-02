<?php

namespace App\Contracts;

use App\Models\MetodoPago;
use App\Models\Venta;

interface ProveedorPagoInterface
{
    /**
    * Procesa un pago mediante un proveedor externo.
    *
    * @return array{
    *     proveedor: string,
    *     referencia_proveedor: string|null,
    *     estado: string,
    *     autorizacion_codigo: string|null,
    *     descripcion: string|null,
    *     client_secret?: string|null
    * }
    */
    public function procesar(
        Venta $venta,
        MetodoPago $metodoPago
    ): array;
}