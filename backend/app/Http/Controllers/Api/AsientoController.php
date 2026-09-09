<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAsientoRequest;
use App\Models\Asiento;
use App\Models\Sala;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AsientoController extends Controller
{
    public function indexPorSala(
        Sala $sala
    ): JsonResponse {
        $asientos = $sala
            ->asientos()
            ->orderBy('fila')
            ->orderBy('numero')
            ->get();

        return response()->json([
            'message' =>
                'Asientos obtenidos correctamente.',
            'data' => $asientos,
        ]);
    }

    public function update(
        UpdateAsientoRequest $request,
        Asiento $asiento
    ): JsonResponse {
        $asiento = DB::transaction(
            function () use (
                $request,
                $asiento
            ): Asiento {
                $asiento = Asiento::query()
                    ->lockForUpdate()
                    ->findOrFail($asiento->id);

                $asiento->update(
                    $request->validated()
                );

                $cantidadActivos = Asiento::query()
                    ->where(
                        'sala_id',
                        $asiento->sala_id
                    )
                    ->where(
                        'estado',
                        'ACTIVO'
                    )
                    ->count();

                Sala::query()
                    ->whereKey(
                        $asiento->sala_id
                    )
                    ->update([
                        'capacidad' =>
                            $cantidadActivos,
                    ]);

                return $asiento->refresh();
            }
        );

        return response()->json([
            'message' =>
                'Asiento actualizado correctamente.',
            'data' => $asiento,
        ]);
    }
}