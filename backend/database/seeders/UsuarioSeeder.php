<?php

namespace Database\Seeders;

use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use RuntimeException;

class UsuarioSeeder extends Seeder
{
    public function run(): void
    {
        $rolAdministrador =
            Rol::query()
                ->where(
                    'nombre',
                    'Administrador'
                )
                ->first();

        if (! $rolAdministrador) {
            throw new RuntimeException(
                'No existe el rol Administrador.'
            );
        }

        $correo = config(
            'app.initial_admin.email'
        );

        $password = config(
            'app.initial_admin.password'
        );

        if (
            ! is_string($correo)
            || trim($correo) === ''
        ) {
            throw new RuntimeException(
                'Debe configurar INITIAL_ADMIN_EMAIL.'
            );
        }

        if (
            ! is_string($password)
            || trim($password) === ''
        ) {
            throw new RuntimeException(
                'Debe configurar INITIAL_ADMIN_PASSWORD.'
            );
        }

        Usuario::query()
            ->updateOrCreate(
                [
                    'correo' =>
                        strtolower(
                            trim($correo)
                        ),
                ],
                [
                    'rol_id' =>
                        $rolAdministrador->id,

                    'nombres' =>
                        config(
                            'app.initial_admin.names',
                            'Administrador'
                        ),

                    'apellidos' =>
                        config(
                            'app.initial_admin.last_names',
                            'Atlantic Cinema'
                        ),

                    'password' =>
                        $password,

                    'estado' =>
                        'ACTIVO',
                ]
            );
    }
}