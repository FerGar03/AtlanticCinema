<?php

namespace Database\Seeders;

use App\Models\Permiso;
use App\Models\Rol;
use Illuminate\Database\Seeder;

class RolPermisoSeeder extends Seeder
{
    /**
     * Ejecuta el seeder.
     */
    public function run(): void
    {
        // Obtener los roles
        $administrador = Rol::where('nombre', 'Administrador')->first();
        $empleado = Rol::where('nombre', 'Empleado')->first();
        $cliente = Rol::where('nombre', 'Cliente')->first();

        // Todos los permisos para el administrador
        $administrador->permisos()->sync(
            Permiso::pluck('id')->toArray()
        );

        // Permisos para el empleado
        $empleado->permisos()->sync(
            Permiso::whereIn('nombre', [
                'peliculas.ver',
                'funciones.ver',
                'reservas.ver',
                'reservas.cancelar',
                'ventas.ver',
                'ventas.registrar',
                'entradas.ver',
                'entradas.generar',
                'pagos.ver',
                'pagos.registrar',
                'facturas.ver',
                'facturas.generar',
                'tickets.ver',
                'tickets.generar',
                'tickets.validar',
                'notificaciones.ver',
                'notificaciones.enviar',
                'notificaciones.procesar',
            ])->pluck('id')->toArray()
        );

        // Permisos para el cliente
        $cliente->permisos()->sync(
            Permiso::whereIn('nombre', [
                'peliculas.ver',
                'funciones.ver',
                'reservas.ver',
                'reservas.crear',
                'ventas.ver',
                'ventas.registrar',
                'pagos.ver',
                'pagos.registrar',
                'facturas.ver',
                'tickets.ver',
                'notificaciones.ver',
            ])->pluck('id')->toArray()
        );
    }
}