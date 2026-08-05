<?php

namespace App\Policies;

use App\Models\Factura;
use App\Models\Usuario;
use App\Models\Venta;

class FacturaPolicy
{
    public function viewAny(Usuario $usuario): bool
    {
        return true;
    }

    public function view(Usuario $usuario, Factura $factura): bool
    {
        if ($this->esPersonalAutorizado($usuario)) {
            return true;
        }

        return $factura->venta?->cliente_id === $usuario->id;
    }

    public function create(Usuario $usuario): bool
    {
        return $this->esPersonalAutorizado($usuario);
    }

    public function generarParaVenta(
        Usuario $usuario,
        Venta $venta
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