<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GenerarTicketRequest;
use App\Models\Ticket;
use App\Services\TicketService;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\ValidarTicketRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TicketController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService
    ) {
    }

    /**
     * Lista todos los tickets.
     */
    public function index(): JsonResponse
    {
        $tickets = Ticket::query()
            ->with([
                'entrada.venta',
                'notificaciones',
            ])
            ->latest('generado_en')
            ->get();

        return response()->json([
            'message' => 'Tickets obtenidos correctamente.',
            'data' => $tickets,
        ]);
    }

    /**
     * Genera los tickets de una venta pagada.
     */
    public function store(GenerarTicketRequest $request): JsonResponse
    {
        $tickets = $this->ticketService->generarParaVenta(
            (int) $request->validated('venta_id')
        );

        return response()->json([
            'message' => 'Tickets generados correctamente.',
            'data' => $tickets,
        ], 201);
    }

    /**
     * Muestra un ticket específico.
     */
    public function show(Ticket $ticket): JsonResponse
    {
        $ticket->load([
            'entrada.venta',
            'notificaciones',
        ]);

        return response()->json([
            'message' => 'Ticket obtenido correctamente.',
            'data' => $ticket,
        ]);
    }

    /**
    * Valida y utiliza un ticket electrónico.
    */
    public function validar(ValidarTicketRequest $request): JsonResponse
    {
        $ticket = DB::transaction(function () use ($request) {
            $ticket = Ticket::query()
                ->with([
                    'entrada.venta',
                    'entrada.funcionAsiento.asiento',
                    'entrada.funcionAsiento.funcion.pelicula',
                    'entrada.funcionAsiento.funcion.sala',
                ])
                ->where(
                    'token_validacion',
                    $request->validated('token_validacion')
                )
                ->lockForUpdate()
                ->first();

            if (! $ticket) {
                throw ValidationException::withMessages([
                    'token_validacion' => [
                        'El ticket indicado no existe.',
                    ],
                ]);
            }

            if ($ticket->estado !== 'ACTIVO') {
                throw ValidationException::withMessages([
                    'token_validacion' => [
                        'El ticket no se encuentra activo.',
                    ],
                ]);
            }

            if (! $ticket->entrada) {
                throw ValidationException::withMessages([
                    'token_validacion' => [
                        'El ticket no tiene una entrada asociada.',
                    ],
                ]);
            }

            if ($ticket->entrada->estado !== 'VALIDA') {
                throw ValidationException::withMessages([
                    'token_validacion' => [
                        'La entrada asociada no se encuentra válida.',
                    ],
                ]);
            }

            $fechaUtilizacion = now();

            $ticket->update([
                'estado' => 'UTILIZADO',
                'utilizado_en' => $fechaUtilizacion,
            ]);

            $ticket->entrada->update([
                'estado' => 'UTILIZADA',
                'utilizada_en' => $fechaUtilizacion,
            ]);

            return $ticket->fresh([
                'entrada.venta',
                'entrada.funcionAsiento.asiento',
                'entrada.funcionAsiento.funcion.pelicula',
                'entrada.funcionAsiento.funcion.sala',
            ]);
        });

        return response()->json([
            'message' => 'Ticket validado correctamente.',
            'data' => $ticket,
        ]);
    }
}