<?php

namespace App\Services;

use App\Models\Funcion;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FuncionService
{
    /**
     * Crea una función y genera su mapa inicial de asientos.
     *
     * @param array<string, mixed> $datos
     */
    public function crear(array $datos): Funcion
    {
        return DB::transaction(function () use ($datos) {
            $existeTraslape = Funcion::query()
                ->where('sala_id', $datos['sala_id'])
                ->whereNotIn('estado', ['CANCELADA'])
                ->where('inicia_en', '<', $datos['finaliza_en'])
                ->where('finaliza_en', '>', $datos['inicia_en'])
                ->exists();

            if ($existeTraslape) {
                throw ValidationException::withMessages([
                    'inicia_en' => 'La sala ya tiene una función programada en ese horario.',
                ]);
            }

            $funcion = Funcion::create($datos);

            $asientos = $funcion->sala
                ->asientos()
                ->where('estado', 'ACTIVO')
                ->get();

            if ($asientos->isEmpty()) {
                throw ValidationException::withMessages([
                    'sala_id' => 'La sala seleccionada no tiene asientos activos.',
                ]);
            }

            $registros = $asientos->map(fn ($asiento) => [
                'asiento_id' => $asiento->id,
                'precio' => $funcion->precio_base,
                'estado' => 'DISPONIBLE',
                'bloqueado_hasta' => null,
            ])->all();

            $funcion->asientos()->createMany($registros);

            return $funcion->load([
                'pelicula',
                'sala',
                'formato',
                'asientos.asiento',
            ]);
        });
    }
}