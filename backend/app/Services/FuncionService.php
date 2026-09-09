<?php

namespace App\Services;

use App\Models\Formato;
use App\Models\Funcion;
use Illuminate\Support\Carbon;
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
            $this->validarTraslape(
                salaId: $datos['sala_id'],
                iniciaEn: $datos['inicia_en'],
                finalizaEn: $datos['finaliza_en'],
            );

            $precioBase = $this->obtenerPrecioFormato(
                $datos['formato_id']
            );

            $datos['precio_base'] = $precioBase;

            $funcion = Funcion::query()->create($datos);

            $this->generarMapaAsientos($funcion);

            return $funcion->load([
                'pelicula',
                'sala',
                'formato',
                'asientos.asiento',
            ]);
        });
    }

    /**
     * Actualiza una función existente.
     *
     * @param array<string, mixed> $datos
     */
    public function actualizar(
        Funcion $funcion,
        array $datos
    ): Funcion {
        return DB::transaction(function () use (
            $funcion,
            $datos
        ) {
            $funcion = Funcion::query()
                ->lockForUpdate()
                ->findOrFail($funcion->id);

            if ($funcion->estado !== 'PROGRAMADA') {
                throw ValidationException::withMessages([
                    'funcion' =>
                        'Solamente pueden editarse funciones que se encuentren PROGRAMADAS.',
                ]);
            }

            if (
                $funcion->reservas()->exists()
                || $funcion->ventas()->exists()
            ) {
                throw ValidationException::withMessages([
                    'funcion' =>
                        'La función no puede modificarse porque ya tiene reservas o ventas asociadas.',
                ]);
            }

            $salaId = (int) (
                $datos['sala_id']
                ?? $funcion->sala_id
            );

            $peliculaId = (int) (
                $datos['pelicula_id']
                ?? $funcion->pelicula_id
            );

            $formatoId = (int) (
                $datos['formato_id']
                ?? $funcion->formato_id
            );

            $iniciaEn = Carbon::parse(
                $datos['inicia_en']
                ?? $funcion->inicia_en
            );

            $finalizaEn = Carbon::parse(
                $datos['finaliza_en']
                ?? $funcion->finaliza_en
            );

            if ($finalizaEn->lessThanOrEqualTo($iniciaEn)) {
                throw ValidationException::withMessages([
                    'finaliza_en' =>
                        'La finalización debe ser posterior al inicio.',
                ]);
            }

            if ($iniciaEn->isPast()) {
                throw ValidationException::withMessages([
                    'inicia_en' =>
                        'La función no puede iniciar en una fecha pasada.',
                ]);
            }

            $this->validarTraslape(
                salaId: $salaId,
                iniciaEn: $iniciaEn,
                finalizaEn: $finalizaEn,
                ignorarFuncionId: $funcion->id,
            );

            $precioBase = $this->obtenerPrecioFormato(
                $formatoId
            );

            $cambioSala =
                $salaId !== $funcion->sala_id;

            $cambioFormato =
                $formatoId !== $funcion->formato_id;

            $funcion->update([
                'pelicula_id' => $peliculaId,
                'sala_id' => $salaId,
                'formato_id' => $formatoId,
                'inicia_en' => $iniciaEn,
                'finaliza_en' => $finalizaEn,
                'precio_base' => $precioBase,
            ]);

            if ($cambioSala) {
                $funcion->asientos()->delete();

                $this->generarMapaAsientos($funcion);
            } elseif ($cambioFormato) {
                $funcion->asientos()->update([
                    'precio' => $precioBase,
                ]);
            }

            return $funcion->refresh()->load([
                'pelicula',
                'sala',
                'formato',
                'asientos.asiento',
            ]);
        });
    }

    /**
     * Cancela una función programada.
     */
    public function cancelar(Funcion $funcion): Funcion
    {
        return DB::transaction(function () use ($funcion) {
            $funcion = Funcion::query()
                ->lockForUpdate()
                ->findOrFail($funcion->id);

            if ($funcion->estado === 'CANCELADA') {
                throw ValidationException::withMessages([
                    'funcion' =>
                        'La función ya se encuentra cancelada.',
                ]);
            }

            if ($funcion->estado === 'FINALIZADA') {
                throw ValidationException::withMessages([
                    'funcion' =>
                        'Una función finalizada no puede cancelarse.',
                ]);
            }

            if ($funcion->estado === 'ACTIVA') {
                throw ValidationException::withMessages([
                    'funcion' =>
                        'Una función que ya se encuentra activa no puede cancelarse.',
                ]);
            }

            if ($funcion->ventas()->exists()) {
                throw ValidationException::withMessages([
                    'funcion' =>
                        'La función no puede cancelarse porque tiene ventas asociadas. El flujo de reembolso todavía no está implementado.',
                ]);
            }

            $tieneReservasPendientes = $funcion
                ->reservas()
                ->where('estado', 'PENDIENTE')
                ->exists();

            if ($tieneReservasPendientes) {
                throw ValidationException::withMessages([
                    'funcion' =>
                        'La función no puede cancelarse mientras tenga reservas pendientes.',
                ]);
            }

            $funcion->update([
                'estado' => 'CANCELADA',
            ]);

            return $funcion->refresh()->load([
                'pelicula',
                'sala',
                'formato',
            ]);
        });
    }

    /**
     * Verifica que la sala no tenga otro horario superpuesto.
     */
    private function validarTraslape(
        int $salaId,
        mixed $iniciaEn,
        mixed $finalizaEn,
        ?int $ignorarFuncionId = null
    ): void {
        $query = Funcion::query()
            ->where('sala_id', $salaId)
            ->whereNotIn('estado', [
                'CANCELADA',
            ])
            ->where(
                'inicia_en',
                '<',
                $finalizaEn
            )
            ->where(
                'finaliza_en',
                '>',
                $iniciaEn
            );

        if ($ignorarFuncionId !== null) {
            $query->whereKeyNot(
                $ignorarFuncionId
            );
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'inicia_en' =>
                    'La sala ya tiene una función programada en ese horario.',
            ]);
        }
    }

    /**
     * Obtiene el precio configurado para el formato.
     */
    private function obtenerPrecioFormato(
        int $formatoId
    ): float {
        $formato = Formato::query()
            ->whereKey($formatoId)
            ->where('estado', 'ACTIVO')
            ->first();

        if (! $formato) {
            throw ValidationException::withMessages([
                'formato_id' =>
                    'El formato seleccionado no existe o está inactivo.',
            ]);
        }

        return match (strtoupper($formato->nombre)) {
            '2D' => 35.00,
            '3D' => 45.00,

            default =>
                throw ValidationException::withMessages([
                    'formato_id' =>
                        'El formato seleccionado no tiene un precio configurado.',
                ]),
        };
    }

    /**
     * Genera el mapa de asientos para una función.
     */
    private function generarMapaAsientos(
        Funcion $funcion
    ): void {
        $asientos = $funcion
            ->sala
            ->asientos()
            ->where('estado', 'ACTIVO')
            ->get();

        if ($asientos->isEmpty()) {
            throw ValidationException::withMessages([
                'sala_id' =>
                    'La sala seleccionada no tiene asientos activos.',
            ]);
        }

        $registros = $asientos
            ->map(fn ($asiento) => [
                'asiento_id' => $asiento->id,
                'precio' => $funcion->precio_base,
                'estado' => 'DISPONIBLE',
                'bloqueado_hasta' => null,
            ])
            ->all();

        $funcion
            ->asientos()
            ->createMany($registros);
    }
}