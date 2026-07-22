<?php

namespace Database\Seeders;

use App\Models\Rol;
use Illuminate\Database\Seeder;

class RolSeeder extends Seeder
{
    /**
     * Ejecuta el seeder de roles.
     */
    public function run(): void
    {
        $roles = [
            [
                'nombre' => 'Administrador',
                'descripcion' => 'Acceso completo al sistema.',
                'estado' => 'ACTIVO',
            ],
            [
                'nombre' => 'Empleado',
                'descripcion' => 'Gestión de ventas, reservas y funciones.',
                'estado' => 'ACTIVO',
            ],
            [
                'nombre' => 'Cliente',
                'descripcion' => 'Compra y reserva de entradas.',
                'estado' => 'ACTIVO',
            ],
        ];

        foreach ($roles as $rol) {
            Rol::updateOrCreate(
                ['nombre' => $rol['nombre']],
                [
                    'descripcion' => $rol['descripcion'],
                    'estado' => $rol['estado'],
                ]
            );
        }
    }
}