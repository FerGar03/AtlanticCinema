<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReservaRequest;
use App\Models\Reserva;
use App\Services\ReservaService;
use Illuminate\Http\JsonResponse;

class ReservaController extends Controller
{
    public function __construct(
        private readonly ReservaService $reservaService
    ) {
    }

    /**
     * Lista las reservas registradas.
     */
    public function index(): JsonResponse
    {
        $reservas = Reserva::query()
            ->with([
                'usuario.rol',
                'funcion.pelicula',
                'funcion.sala',
                'funcion.formato',
                'detalles.funcionAsiento.asiento',
            ])
            ->latest('reservada_en')
            ->get();

        return response()->json([
            'message' => 'Reservas obtenidas correctamente.',
            'data' => $reservas,
        ]);
    }

    /**
     * Crea una nueva reserva.
     */
    public function store(StoreReservaRequest $request): JsonResponse
    {
        $reserva = $this->reservaService->crear(
            $request->validated()
        );

        return response()->json([
            'message' => 'Reserva creada correctamente.',
            'data' => $reserva,
        ], 201);
    }

    /**
     * Muestra una reserva específica.
     */
    public function show(Reserva $reserva): JsonResponse
    {
        $reserva->load([
            'usuario.rol',
            'funcion.pelicula',
            'funcion.sala',
            'funcion.formato',
            'detalles.funcionAsiento.asiento',
        ]);

        return response()->json([
            'message' => 'Reserva obtenida correctamente.',
            'data' => $reserva,
        ]);
    }
}