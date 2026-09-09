<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSalaRequest;
use App\Models\Sala;
use Illuminate\Http\JsonResponse;

class SalaController extends Controller
{
    public function index(): JsonResponse
    {
        $salas = Sala::query()
            ->withCount([
                'asientos' => fn ($query) =>
                    $query->where('estado', 'ACTIVO'),
            ])
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'message' =>
                'Salas obtenidas correctamente.',
            'data' => $salas,
        ]);
    }

    public function show(
        Sala $sala
    ): JsonResponse {
        $sala->load([
            'asientos' => fn ($query) =>
                $query
                    ->orderBy('fila')
                    ->orderBy('numero'),
        ]);

        $sala->loadCount([
            'asientos' => fn ($query) =>
                $query->where('estado', 'ACTIVO'),
        ]);

        return response()->json([
            'message' =>
                'Sala obtenida correctamente.',
            'data' => $sala,
        ]);
    }

    public function update(
        UpdateSalaRequest $request,
        Sala $sala
    ): JsonResponse {
        $sala->update(
            $request->validated()
        );

        $sala->refresh();

        $sala->loadCount([
            'asientos' => fn ($query) =>
                $query->where('estado', 'ACTIVO'),
        ]);

        return response()->json([
            'message' =>
                'Sala actualizada correctamente.',
            'data' => $sala,
        ]);
    }
}