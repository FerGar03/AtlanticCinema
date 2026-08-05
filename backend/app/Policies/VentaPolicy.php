<?php

namespace App\Policies;

use App\Models\Usuario;
use App\Models\Venta;

class VentaPolicy
{
    /**
     * Determina si el usuario puede consultar el listado.
     *
     * El filtrado de registros propios se realizará en el controlador.
     */
    public function viewAny(Usuario $usuario): bool
    {
        return true;
    }

    /**
     * Determina si puede consultar una venta específica.
     */
    public function view(Usuario $usuario, Venta $venta): bool
    {
        if ($this->esPersonalAutorizado($usuario)) {
            return true;
        }

        return $venta->cliente_id === $usuario->id;
    }

    /**
     * Determina si puede registrar una venta.
     */
    public function create(Usuario $usuario): bool
    {
        return true;
    }

    /**
     * Comprueba si el usuario es administrador o empleado.
     */
    private function esPersonalAutorizado(Usuario $usuario): bool
    {
        return in_array(
            $usuario->rol?->nombre,
            ['Administrador', 'Empleado'],
            true
        );
    }
}