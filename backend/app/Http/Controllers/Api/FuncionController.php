<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFuncionRequest;
use App\Http\Requests\UpdateFuncionRequest;
use App\Models\Funcion;
use App\Services\FuncionService;
use Illuminate\Http\JsonResponse;

class FuncionController extends Controller
{
    public function __construct(
        private readonly FuncionService $funcionService
    ) {
    }

    public function index(): JsonResponse
    {
        $funciones = Funcion::query()
            ->with([
                'pelicula',
                'sala',
                'formato',
            ])
            ->withCount([
                'reservas',
                'ventas',
            ])
            ->orderBy('inicia_en')
            ->get();

        return response()->json([
            'message' =>
                'Funciones obtenidas correctamente.',
            'data' => $funciones,
        ]);
    }

    public function store(
        StoreFuncionRequest $request
    ): JsonResponse {
        $funcion = $this
            ->funcionService
            ->crear(
                $request->validated()
            );

        return response()->json([
            'message' =>
                'Función creada correctamente.',
            'data' => $funcion,
        ], 201);
    }

    public function show(
        Funcion $funcion
    ): JsonResponse {
        $funcion->load([
            'pelicula',
            'sala',
            'formato',
            'asientos.asiento',
        ]);

        $funcion->loadCount([
            'reservas',
            'ventas',
        ]);

        return response()->json([
            'message' =>
                'Función obtenida correctamente.',
            'data' => $funcion,
        ]);
    }

    public function update(
        UpdateFuncionRequest $request,
        Funcion $funcion
    ): JsonResponse {
        $funcion = $this
            ->funcionService
            ->actualizar(
                $funcion,
                $request->validated()
            );

        return response()->json([
            'message' =>
                'Función actualizada correctamente.',
            'data' => $funcion,
        ]);
    }

    public function cancelar(
        Funcion $funcion
    ): JsonResponse {
        $funcion = $this
            ->funcionService
            ->cancelar($funcion);

        return response()->json([
            'message' =>
                'Función cancelada correctamente.',
            'data' => $funcion,
        ]);
    }
}