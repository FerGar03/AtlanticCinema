<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GenerarTicketRequest;
use App\Http\Requests\ValidarTicketRequest;
use App\Models\Ticket;
use App\Models\Venta;
use App\Services\TicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class TicketController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Ticket::class);

        $usuario = $request->user();

        $consulta = Ticket::query()
            ->with([
                'entrada.venta.cliente',
                'entrada.venta.empleado',
                'entrada.funcionAsiento.asiento',
                'entrada.funcionAsiento.funcion.pelicula',
                'entrada.funcionAsiento.funcion.sala',
                'entrada.funcionAsiento.funcion.formato',
                'notificaciones',
            ]);

        if ($usuario->rol?->nombre === 'Cliente') {
            $consulta->whereHas(
                'entrada.venta',
                function ($query) use ($usuario): void {
                    $query->where(
                        'cliente_id',
                        $usuario->id
                    );
                }
            );
        }

        $tickets = $consulta
            ->latest('generado_en')
            ->get();

        return response()->json([
            'message' =>
                'Tickets obtenidos correctamente.',
            'data' => $tickets,
        ]);
    }

    public function store(
        GenerarTicketRequest $request
    ): JsonResponse {
        Gate::authorize('create', Ticket::class);

        $venta = Venta::query()
            ->findOrFail(
                $request->integer('venta_id')
            );

        Gate::authorize(
            'generarParaVenta',
            [Ticket::class, $venta]
        );

        $tickets =
            $this->ticketService
                ->generarParaVenta(
                    $venta->id
                );

        return response()->json([
            'message' =>
                'Tickets generados correctamente.',
            'data' => $tickets,
        ], 201);
    }

    public function show(
        Ticket $ticket
    ): JsonResponse {
        Gate::authorize('view', $ticket);

        $ticket->load([
            'entrada.venta.cliente',
            'entrada.venta.empleado',
            'entrada.funcionAsiento.asiento',
            'entrada.funcionAsiento.funcion.pelicula',
            'entrada.funcionAsiento.funcion.sala',
            'entrada.funcionAsiento.funcion.formato',
            'notificaciones',
        ]);

        return response()->json([
            'message' =>
                'Ticket obtenido correctamente.',
            'data' => $ticket,
        ]);
    }

    public function validar(
        ValidarTicketRequest $request
    ): JsonResponse {
        Gate::authorize(
            'validar',
            Ticket::class
        );

        $ticket = DB::transaction(
            function () use ($request) {
                $ticket = Ticket::query()
                    ->with([
                        'entrada.venta.cliente',
                        'entrada.funcionAsiento.asiento',
                        'entrada.funcionAsiento.funcion.pelicula',
                        'entrada.funcionAsiento.funcion.sala',
                        'entrada.funcionAsiento.funcion.formato',
                    ])
                    ->where(
                        'token_validacion',
                        $request->validated(
                            'token_validacion'
                        )
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

                if (
                    $ticket->entrada->estado
                    !== 'VALIDA'
                ) {
                    throw ValidationException::withMessages([
                        'token_validacion' => [
                            'La entrada asociada no se encuentra válida.',
                        ],
                    ]);
                }

                $fechaUtilizacion = now();

                $ticket->update([
                    'estado' => 'UTILIZADO',
                    'utilizado_en' =>
                        $fechaUtilizacion,
                ]);

                $ticket->entrada->update([
                    'estado' => 'UTILIZADA',
                    'utilizada_en' =>
                        $fechaUtilizacion,
                ]);

                return $ticket->fresh([
                    'entrada.venta.cliente',
                    'entrada.funcionAsiento.asiento',
                    'entrada.funcionAsiento.funcion.pelicula',
                    'entrada.funcionAsiento.funcion.sala',
                    'entrada.funcionAsiento.funcion.formato',
                ]);
            }
        );

        return response()->json([
            'message' =>
                'Ticket validado correctamente.',
            'data' => $ticket,
        ]);
    }
}