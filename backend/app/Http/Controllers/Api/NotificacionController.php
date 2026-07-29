<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProcesarNotificacionRequest;
use App\Models\Notificacion;
use App\Services\NotificacionService;
use Illuminate\Http\JsonResponse;

class NotificacionController extends Controller
{
    public function __construct(
        private readonly NotificacionService $notificacionService
    ) {
    }

    /**
     * Lista las notificaciones.
     */
    public function index(): JsonResponse
    {
        $notificaciones = Notificacion::query()
            ->with([
                'usuario',
                'venta',
                'reserva',
                'factura',
                'ticket',
            ])
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Notificaciones obtenidas correctamente.',
            'data' => $notificaciones,
        ]);
    }

    /**
     * Procesa una notificación pendiente.
     */
    public function procesar(
        ProcesarNotificacionRequest $request
    ): JsonResponse {
        $notificacion = $this->notificacionService->procesar(
            (int) $request->validated('notificacion_id')
        );

        return response()->json([
            'message' => 'Notificación procesada correctamente.',
            'data' => $notificacion,
        ]);
    }

    /**
     * Muestra una notificación específica.
     */
    public function show(
        Notificacion $notificacion
    ): JsonResponse {
        $notificacion->load([
            'usuario',
            'venta',
            'reserva',
            'factura',
            'ticket',
        ]);

        return response()->json([
            'message' => 'Notificación obtenida correctamente.',
            'data' => $notificacion,
        ]);
    }
}