<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReservaRequest;
use App\Models\Reserva;
use App\Services\ReservaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ReservaController extends Controller
{
    public function __construct(
        private readonly ReservaService $reservaService
    ) {
    }

    /**
    * Lista las reservas autorizadas para el usuario autenticado.
    */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Reserva::class);

        $usuario = $request->user();

        $consulta = Reserva::query()
            ->with([
                'usuario.rol',
                'funcion.pelicula',
                'funcion.sala',
                'funcion.formato',
                'detalles.funcionAsiento.asiento',
            ]);

        if ($usuario->rol?->nombre === 'Cliente') {
            $consulta->where('usuario_id', $usuario->id);
        }

        $reservas = $consulta
            ->latest('reservada_en')
            ->get();

        return response()->json([
            'message' => 'Reservas obtenidas correctamente.',
            'data' => $reservas,
        ]);
    }

    /**
     * Crea una nueva reserva para el usuario autenticado.
     */
    public function store(StoreReservaRequest $request): JsonResponse
    {
        Gate::authorize('create', Reserva::class);

        $usuario = $request->user();
        $datos = $request->validated();

        $datos['usuario_id'] = $usuario->id;

        if ($usuario->rol?->nombre === 'Cliente') {
            $datos['descuento'] = 0;
        }

        $reserva = $this->reservaService->crear($datos);

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
        Gate::authorize('view', $reserva);

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