<?php

namespace App\Policies;

use App\Models\Pago;
use App\Models\Usuario;
use App\Models\Venta;

class PagoPolicy
{
    public function viewAny(Usuario $usuario): bool
    {
        return true;
    }

    public function view(Usuario $usuario, Pago $pago): bool
    {
        if ($this->esPersonalAutorizado($usuario)) {
            return true;
        }

        return $pago->venta?->cliente_id === $usuario->id;
    }

    public function create(Usuario $usuario): bool
    {
        return true;
    }

    public function registrarParaVenta(
        Usuario $usuario,
        Venta $venta
    ): bool {
        if ($this->esPersonalAutorizado($usuario)) {
            return true;
        }

        return $venta->cliente_id === $usuario->id;
    }

    public function confirmarSimulacion(
        Usuario $usuario,
        Pago $pago
    ): bool {
        return $this->esPersonalAutorizado($usuario);
    }

    private function esPersonalAutorizado(Usuario $usuario): bool
    {
        return in_array(
            $usuario->rol?->nombre,
            ['Administrador', 'Empleado'],
            true
        );
    }
}