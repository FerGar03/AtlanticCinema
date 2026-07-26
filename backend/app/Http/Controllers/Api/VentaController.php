<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ConvertirReservaVentaRequest;
use App\Models\Venta;
use App\Services\VentaService;
use Illuminate\Http\JsonResponse;

class VentaController extends Controller
{
    public function __construct(
        private readonly VentaService $ventaService
    ) {
    }

    /**
     * Lista las ventas registradas.
     */
    public function index(): JsonResponse
    {
        $ventas = Venta::query()
            ->with([
                'cliente',
                'empleado',
                'reserva',
                'funcion.pelicula',
                'funcion.sala',
                'entradas.funcionAsiento.asiento',
            ])
            ->latest('realizada_en')
            ->get();

        return response()->json([
            'message' => 'Ventas obtenidas correctamente.',
            'data' => $ventas,
        ]);
    }

    /**
     * Convierte una reserva pendiente en venta.
     */
    public function storeDesdeReserva(
        ConvertirReservaVentaRequest $request
    ): JsonResponse {
        $venta = $this->ventaService->crearDesdeReserva(
            reservaId: $request->integer('reserva_id'),
            empleadoId: $request->filled('empleado_id')
                ? $request->integer('empleado_id')
                : null,
        );

        return response()->json([
            'message' => 'Reserva convertida en venta correctamente.',
            'data' => $venta,
        ], 201);
    }

    /**
     * Muestra una venta específica.
     */
    public function show(Venta $venta): JsonResponse
    {
        $venta->load([
            'cliente',
            'empleado',
            'reserva',
            'funcion.pelicula',
            'funcion.sala',
            'funcion.formato',
            'entradas.funcionAsiento.asiento',
        ]);

        return response()->json([
            'message' => 'Venta obtenida correctamente.',
            'data' => $venta,
        ]);
    }
}