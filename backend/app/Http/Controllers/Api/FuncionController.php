<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFuncionRequest;
use App\Models\Funcion;
use App\Services\FuncionService;
use Illuminate\Http\JsonResponse;

class FuncionController extends Controller
{
    /**
     * Crea una instancia del controlador.
     */
    public function __construct(
        private readonly FuncionService $funcionService
    ) {
    }

    /**
     * Muestra el listado de funciones.
     */
    public function index(): JsonResponse
    {
        $funciones = Funcion::query()
            ->with([
                'pelicula',
                'sala',
                'formato',
            ])
            ->orderBy('inicia_en')
            ->get();

        return response()->json([
            'message' => 'Funciones obtenidas correctamente.',
            'data' => $funciones,
        ]);
    }

    /**
     * Registra una nueva función.
     */
    public function store(StoreFuncionRequest $request): JsonResponse
    {
        $funcion = $this->funcionService->crear(
            $request->validated()
        );

        return response()->json([
            'message' => 'Función creada correctamente.',
            'data' => $funcion,
        ], 201);
    }

    /**
     * Muestra una función específica.
     */
    public function show(Funcion $funcion): JsonResponse
    {
        $funcion->load([
            'pelicula',
            'sala',
            'formato',
            'asientos.asiento',
        ]);

        return response()->json([
            'message' => 'Función obtenida correctamente.',
            'data' => $funcion,
        ]);
    }
}