<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProcesarNotificacionRequest;
use App\Models\Notificacion;
use App\Services\NotificacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class NotificacionController extends Controller
{
    public function __construct(
        private readonly NotificacionService $notificacionService
    ) {
    }

    /**
     * Lista las notificaciones autorizadas para el usuario autenticado.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Notificacion::class);

        $usuario = $request->user();

        $consulta = Notificacion::query()
            ->with([
                'usuario',
                'venta',
                'reserva',
                'factura',
                'ticket',
            ]);

        if ($usuario->rol?->nombre === 'Cliente') {
            $consulta->where(
                'usuario_id',
                $usuario->id
            );
        }

        $notificaciones = $consulta
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
        Gate::authorize(
            'procesar',
            Notificacion::class
        );

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
        Gate::authorize('view', $notificacion);

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