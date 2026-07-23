<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
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
            PeliculaSeeder::class,
        ]);
    }
}