<?php

namespace App\Policies;

use App\Models\Notificacion;
use App\Models\Usuario;

class NotificacionPolicy
{
    /**
     * Determina si el usuario puede consultar el listado.
     *
     * El controlador filtrará las notificaciones propias
     * cuando el usuario tenga rol Cliente.
     */
    public function viewAny(Usuario $usuario): bool
    {
        return true;
    }

    /**
     * Determina si puede consultar una notificación específica.
     */
    public function view(
        Usuario $usuario,
        Notificacion $notificacion
    ): bool {
        if ($this->esPersonalAutorizado($usuario)) {
            return true;
        }

        return $notificacion->usuario_id === $usuario->id;
    }

    /**
     * Determina si puede procesar notificaciones.
     */
    public function procesar(Usuario $usuario): bool
    {
        return $this->esPersonalAutorizado($usuario);
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