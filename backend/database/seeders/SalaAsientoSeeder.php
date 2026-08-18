<?php

namespace Database\Seeders;

use App\Models\Asiento;
use App\Models\Sala;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SalaAsientoSeeder extends Seeder
{
    /**
     * Ejecuta el seeder.
     */
    public function run(): void
    {
        DB::transaction(function () {
            $this->crearSala1();
            $this->crearSala2();
        });
    }

    /**
     * Configura la Sala 1 con 141 asientos.
     */
    private function crearSala1(): void
    {
        $sala = Sala::query()->find(1);

        if (! $sala) {
            $sala = Sala::query()->create([
                'nombre' => 'Sala 1',
                'capacidad' => 141,
                'descripcion' => 'Sala 1 de Atlantic Cinema.',
                'estado' => 'ACTIVA',
            ]);
        } else {
            $sala->update([
                'nombre' => 'Sala 1',
                'capacidad' => 141,
                'descripcion' => 'Sala 1 de Atlantic Cinema.',
                'estado' => 'ACTIVA',
            ]);
        }

        $distribucion = [
            'A' => 18,
            'B' => 20,
            'C' => 20,
            'D' => 20,
            'E' => 20,
            'F' => 20,
            'G' => 23,
        ];

        $this->crearAsientos($sala, $distribucion);

        $cantidadAsientos = $sala->asientos()->count();

        if ($cantidadAsientos !== 141) {
            throw new \RuntimeException(
                "La Sala 1 debe tener 141 asientos, pero posee {$cantidadAsientos}.",
            );
        }
    }

    /**
     * Configura la Sala 2 con 144 asientos.
     */
    private function crearSala2(): void
    {
        $sala = Sala::query()->find(5);

        if (! $sala) {
            $sala = Sala::query()->create([
                'nombre' => 'Sala 2',
                'capacidad' => 144,
                'descripcion' => 'Sala 2 de Atlantic Cinema.',
                'estado' => 'ACTIVA',
            ]);
        } else {
            $sala->update([
                'nombre' => 'Sala 2',
                'capacidad' => 144,
                'descripcion' => 'Sala 2 de Atlantic Cinema.',
                'estado' => 'ACTIVA',
            ]);
        }

        $distribucion = [
            'A' => 18,
            'B' => 20,
            'C' => 20,
            'D' => 20,
            'E' => 20,
            'F' => 23,
            'G' => 23,
        ];

        $this->crearAsientos($sala, $distribucion);

        $cantidadAsientos = $sala->asientos()->count();

        if ($cantidadAsientos !== 144) {
            throw new \RuntimeException(
                "La Sala 2 debe tener 144 asientos, pero posee {$cantidadAsientos}.",
            );
        }
    }

    /**
     * Crea los asientos faltantes y activa los existentes.
     */
    private function crearAsientos(
        Sala $sala,
        array $distribucion,
    ): void {
        foreach ($distribucion as $fila => $cantidad) {
            for ($numero = 1; $numero <= $cantidad; $numero++) {
                $asiento = Asiento::query()->firstOrCreate(
                    [
                        'sala_id' => $sala->id,
                        'fila' => $fila,
                        'numero' => (string) $numero,
                    ],
                    [
                        'tipo' => 'NORMAL',
                        'estado' => 'ACTIVO',
                    ],
                );

                if ($asiento->estado !== 'ACTIVO') {
                    $asiento->update([
                        'estado' => 'ACTIVO',
                    ]);
                }
            }
        }
    }
}