<?php

namespace Database\Seeders;

use App\Models\Permiso;
use Illuminate\Database\Seeder;

class PermisoSeeder extends Seeder
{
    /**
     * Ejecuta el seeder.
     */
    public function run(): void
    {
        $permisos = [

            // Usuarios
            ['usuarios.ver', 'Permite consultar los usuarios del sistema.'],
            ['usuarios.crear', 'Permite registrar nuevos usuarios.'],
            ['usuarios.editar', 'Permite modificar la información de los usuarios.'],
            ['usuarios.eliminar', 'Permite eliminar usuarios del sistema.'],

            // Roles
            ['roles.ver', 'Permite consultar los roles del sistema.'],
            ['roles.crear', 'Permite registrar nuevos roles.'],
            ['roles.editar', 'Permite modificar los roles existentes.'],
            ['roles.eliminar', 'Permite eliminar roles del sistema.'],

            // Permisos
            ['permisos.ver', 'Permite consultar los permisos del sistema.'],
            ['permisos.crear', 'Permite registrar nuevos permisos.'],
            ['permisos.editar', 'Permite modificar los permisos existentes.'],
            ['permisos.eliminar', 'Permite eliminar permisos del sistema.'],

            // Películas
            ['peliculas.ver', 'Permite consultar las películas.'],
            ['peliculas.crear', 'Permite registrar nuevas películas.'],
            ['peliculas.editar', 'Permite modificar la información de las películas.'],
            ['peliculas.eliminar', 'Permite eliminar películas.'],

            // Salas
            ['salas.ver', 'Permite consultar las salas.'],
            ['salas.crear', 'Permite registrar nuevas salas.'],
            ['salas.editar', 'Permite modificar las salas.'],
            ['salas.eliminar', 'Permite eliminar salas.'],

            // Funciones
            ['funciones.ver', 'Permite consultar las funciones.'],
            ['funciones.crear', 'Permite registrar nuevas funciones.'],
            ['funciones.editar', 'Permite modificar funciones existentes.'],
            ['funciones.cancelar', 'Permite cancelar funciones.'],

            // Reservas
            ['reservas.ver', 'Permite consultar las reservas.'],
            ['reservas.crear', 'Permite registrar reservas.'],
            ['reservas.cancelar', 'Permite cancelar reservas.'],

            // Ventas
            ['ventas.ver', 'Permite consultar las ventas.'],
            ['ventas.registrar', 'Permite registrar ventas de entradas.'],

            // Entradas
            ['entradas.ver', 'Permite consultar las entradas emitidas.'],
            ['entradas.generar', 'Permite generar entradas para los clientes.'],

            // Pagos
            ['pagos.ver', 'Permite consultar los pagos.'],
            ['pagos.registrar', 'Permite registrar pagos.'],

            // Facturación
            ['facturas.ver', 'Permite consultar las facturas electrónicas.'],
            ['facturas.generar', 'Permite generar facturas electrónicas.'],

            // Reportes
            ['reportes.ver', 'Permite consultar los reportes del sistema.'],

            // Notificaciones
            ['notificaciones.enviar', 'Permite enviar notificaciones a los clientes.'],
        ];

        foreach ($permisos as [$nombre, $descripcion]) {
            Permiso::updateOrCreate(
                ['nombre' => $nombre],
                [
                    'descripcion' => $descripcion,
                    'estado' => 'ACTIVO',
                ]
            );
        }
    }
}