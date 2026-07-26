<?php

namespace Database\Seeders;

use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class UsuarioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rolAdministrador = Rol::query()
            ->where('nombre', 'Administrador')
            ->first();

        if (! $rolAdministrador) {
            $this->command->error(
                'No existe el rol Administrador.'
            );

            return;
        }

        Usuario::updateOrCreate(
            [
                'correo' => 'cliente@atlanticcinema.com',
            ],
            [
                'rol_id' => $rolAdministrador->id,
                'nombres' => 'Usuario',
                'apellidos' => 'Prueba',
                'password' => 'password',
                'telefono' => '55550000',
                'nit' => 'CF',
                'direccion' => 'Guatemala',
                'estado' => 'ACTIVO',
            ]
        );
    }
}