<?php

namespace App\Policies;

use App\Models\Reserva;
use App\Models\Usuario;

class ReservaPolicy
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
     * Determina si puede consultar una reserva específica.
     */
    public function view(Usuario $usuario, Reserva $reserva): bool
    {
        if ($this->esPersonalAutorizado($usuario)) {
            return true;
        }

        return $reserva->usuario_id === $usuario->id;
    }

    /**
     * Determina si puede crear reservas.
     */
    public function create(Usuario $usuario): bool
    {
        return true;
    }

    /**
     * Determina si puede convertir una reserva en venta.
     */
    public function convertirEnVenta(
        Usuario $usuario,
        Reserva $reserva
    ): bool {
        if ($this->esPersonalAutorizado($usuario)) {
            return true;
        }

        return $reserva->usuario_id === $usuario->id;
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