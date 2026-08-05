<?php

namespace App\Policies;

use App\Models\Ticket;
use App\Models\Usuario;
use App\Models\Venta;

class TicketPolicy
{
    /**
     * Determina si el usuario puede consultar el listado de tickets.
     *
     * El controlador filtrará los tickets propios cuando sea Cliente.
     */
    public function viewAny(Usuario $usuario): bool
    {
        return true;
    }

    /**
     * Determina si puede consultar un ticket específico.
     */
    public function view(
        Usuario $usuario,
        Ticket $ticket
    ): bool {
        if ($this->esPersonalAutorizado($usuario)) {
            return true;
        }

        return $ticket->entrada?->venta?->cliente_id === $usuario->id;
    }

    /**
     * Determina si puede generar tickets.
     */
    public function create(Usuario $usuario): bool
    {
        return $this->esPersonalAutorizado($usuario);
    }

    /**
     * Determina si puede generar tickets para una venta específica.
     */
    public function generarParaVenta(
        Usuario $usuario,
        Venta $venta
    ): bool {
        return $this->esPersonalAutorizado($usuario);
    }

    /**
     * Determina si puede validar un ticket.
     */
    public function validar(Usuario $usuario): bool
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