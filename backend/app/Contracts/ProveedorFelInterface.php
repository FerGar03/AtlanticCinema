<?php

namespace App\Contracts;

interface ProveedorFelInterface
{
    /**
     * Envía una factura para su certificación FEL.
     *
     * @param  array<string, mixed>  $datosFactura
     * @return array<string, mixed>
     */
    public function certificar(array $datosFactura): array;
}