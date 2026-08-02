<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ConfirmarPagoSimuladoRequest;
use App\Http\Requests\StorePagoRequest;
use App\Models\Pago;
use App\Services\PagoService;
use Illuminate\Http\JsonResponse;

class PagoController extends Controller
{
    public function __construct(
        private readonly PagoService $pagoService
    ) {
    }

    public function index(): JsonResponse
    {
        $pagos = Pago::query()
            ->with([
                'venta',
                'metodoPago',
            ])
            ->latest('id')
            ->get();

        return response()->json([
            'message' => 'Pagos obtenidos correctamente.',
            'data' => $pagos,
        ]);
    }

    public function store(StorePagoRequest $request): JsonResponse
    {
        $pago = $this->pagoService->registrar(
            $request->validated()
        );

        return response()->json([
            'message' => 'Pago registrado correctamente.',
            'data' => $pago,
        ], 201);
    }

    public function confirmarSimulacion(
        ConfirmarPagoSimuladoRequest $request,
        Pago $pago
    ): JsonResponse {
        $pagoConfirmado = $this->pagoService->confirmarSimulado(
            $pago,
            $request->validated('resultado')
    );

    return response()->json([
        'message' => $pagoConfirmado->estado === 'APROBADO'
            ? 'Pago simulado aprobado correctamente.'
            : 'Pago simulado rechazado correctamente.',
            'data' => $pagoConfirmado,
        ]);
    }
    public function show(Pago $pago): JsonResponse
    {
        $pago->load([
            'venta.entradas',
            'metodoPago',
        ]);

        return response()->json([
            'message' => 'Pago obtenido correctamente.',
            'data' => $pago,
        ]);
    }
}