<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ConfirmarPagoSimuladoRequest;
use App\Http\Requests\StorePagoRequest;
use App\Models\Pago;
use App\Models\Venta;
use App\Services\PagoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PagoController extends Controller
{
    public function __construct(
        private readonly PagoService $pagoService
    ) {
    }

    /**
     * Lista los pagos autorizados para el usuario autenticado.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Pago::class);

        $usuario = $request->user();

        $consulta = Pago::query()
            ->with([
                'metodoPago',
                'venta.cliente',
                'venta.empleado',
                'venta.funcion.pelicula',
                'venta.funcion.sala',
                'venta.funcion.formato',
            ]);

        if ($usuario->rol?->nombre === 'Cliente') {
            $consulta->whereHas(
                'venta',
                function ($query) use ($usuario): void {
                    $query->where(
                        'cliente_id',
                        $usuario->id
                    );
                }
            );
        }

        $pagos = $consulta
            ->latest('id')
            ->get();

        return response()->json([
            'message' =>
                'Pagos obtenidos correctamente.',
            'data' => $pagos,
        ]);
    }

    /**
     * Registra un pago para una venta autorizada.
     */
    public function store(
        StorePagoRequest $request
    ): JsonResponse {
        Gate::authorize('create', Pago::class);

        $venta = Venta::query()
            ->findOrFail(
                $request->integer('venta_id')
            );

        Gate::authorize(
            'registrarParaVenta',
            [Pago::class, $venta]
        );

        $pago = $this->pagoService->registrar(
            $request->validated()
        );

        return response()->json([
            'message' =>
                'Pago registrado correctamente.',
            'data' => $pago,
        ], 201);
    }

    /**
     * Confirma el resultado de un pago simulado.
     */
    public function confirmarSimulacion(
        ConfirmarPagoSimuladoRequest $request,
        Pago $pago
    ): JsonResponse {
        Gate::authorize(
            'confirmarSimulacion',
            $pago
        );

        $pagoConfirmado = $this->pagoService
            ->confirmarSimulado(
                $pago,
                $request->validated('resultado')
            );

        return response()->json([
            'message' =>
                $pagoConfirmado->estado === 'APROBADO'
                    ? 'Pago simulado aprobado correctamente.'
                    : 'Pago simulado rechazado correctamente.',
            'data' => $pagoConfirmado,
        ]);
    }

    /**
     * Muestra un pago específico.
     */
    public function show(Pago $pago): JsonResponse
    {
        Gate::authorize('view', $pago);

        $pago->load([
            'metodoPago',
            'venta.cliente',
            'venta.empleado',
            'venta.funcion.pelicula',
            'venta.funcion.sala',
            'venta.funcion.formato',
            'venta.entradas.funcionAsiento.asiento',
        ]);

        return response()->json([
            'message' =>
                'Pago obtenido correctamente.',
            'data' => $pago,
        ]);
    }
}