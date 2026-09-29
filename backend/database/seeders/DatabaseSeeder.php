<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Inicializa los datos estructurales
     * necesarios para Atlantic Cinema.
     */
    public function run(): void
    {
        $this->call([
            RolSeeder::class,
            PermisoSeeder::class,
            RolPermisoSeeder::class,

            ClasificacionSeeder::class,
            GeneroSeeder::class,
            FormatoSeeder::class,
            MetodoPagoSeeder::class,

            SalaAsientoSeeder::class,

            UsuarioSeeder::class,
        ]);
    }
}