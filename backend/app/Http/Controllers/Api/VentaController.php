<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ComprarEntradaRequest;
use App\Http\Requests\ConvertirReservaVentaRequest;
use App\Models\Reserva;
use App\Models\Venta;
use App\Services\VentaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class VentaController extends Controller
{
    public function __construct(
        private readonly VentaService $ventaService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Venta::class);

        $usuario = $request->user();

        $consulta = Venta::query()
            ->with([
                'cliente',
                'empleado',
                'reserva',
                'funcion.pelicula',
                'funcion.sala',
                'entradas.funcionAsiento.asiento',
            ]);

        if ($usuario->rol?->nombre === 'Cliente') {
            $consulta->where(
                'cliente_id',
                $usuario->id
            );
        }

        $ventas = $consulta
            ->latest('realizada_en')
            ->get();

        return response()->json([
            'message' =>
                'Ventas obtenidas correctamente.',
            'data' => $ventas,
        ]);
    }

    /**
     * Registra una compra directa desde la web.
     */
    public function storeDirecta(
        ComprarEntradaRequest $request
    ): JsonResponse {
        Gate::authorize('create', Venta::class);

        $usuario = $request->user();
        $datos = $request->validated();

        $venta = $this->ventaService->crearDirecta(
            clienteId: $usuario->id,
            funcionId: (int) $datos['funcion_id'],
            funcionAsientoIds:
                $datos['funcion_asiento_ids'],
        );

        return response()->json([
            'message' =>
                'Compra iniciada correctamente.',
            'data' => $venta,
        ], 201);
    }

    public function storeDesdeReserva(
        ConvertirReservaVentaRequest $request
    ): JsonResponse {
        $usuario = $request->user();

        $reserva = Reserva::query()
            ->findOrFail(
                $request->integer('reserva_id')
            );

        Gate::authorize(
            'convertirEnVenta',
            $reserva
        );

        $empleadoId = in_array(
            $usuario->rol?->nombre,
            ['Administrador', 'Empleado'],
            true
        )
            ? $usuario->id
            : null;

        $venta = $this->ventaService
            ->crearDesdeReserva(
                reservaId: $reserva->id,
                empleadoId: $empleadoId,
            );

        return response()->json([
            'message' =>
                'Reserva convertida en venta correctamente.',
            'data' => $venta,
        ], 201);
    }

    public function show(Venta $venta): JsonResponse
    {
        Gate::authorize('view', $venta);

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
            'message' =>
                'Venta obtenida correctamente.',
            'data' => $venta,
        ]);
    }
}