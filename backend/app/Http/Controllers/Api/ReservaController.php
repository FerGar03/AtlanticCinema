<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CancelarReservaRequest;
use App\Http\Requests\StoreReservaRequest;
use App\Models\Reserva;
use App\Services\ReservaService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ReservaController extends Controller
{
    public function __construct(
        private readonly ReservaService $reservaService
    ) {
    }

    /**
     * Lista las reservas autorizadas para
     * el usuario autenticado.
     *
     * El listado puede utilizarse de dos formas:
     *
     * - Sin paginar:
     *   mantiene compatibilidad con otros módulos.
     *
     * - Con paginar=1:
     *   utilizado por administración.
     */
    public function index(
        Request $request
    ): JsonResponse {
        Gate::authorize(
            'viewAny',
            Reserva::class
        );

        $datos = $request->validate([
            'buscar' => [
                'nullable',
                'string',
                'max:150',
            ],

            'estado' => [
                'nullable',
                'string',
                Rule::in([
                    'PENDIENTE',
                    'CONVERTIDA',
                    'CANCELADA',
                    'VENCIDA',
                ]),
            ],

            'paginar' => [
                'nullable',
                'boolean',
            ],

            'per_page' => [
                'nullable',
                'integer',
                Rule::in([
                    20,
                    50,
                    100,
                ]),
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $usuario =
            $request->user();

        $consulta =
            Reserva::query()
                ->with([
                    'usuario.rol',
                    'funcion.pelicula',
                    'funcion.sala',
                    'funcion.formato',
                    'detalles.funcionAsiento.asiento',
                    'venta',
                ]);

        /*
         * Un cliente únicamente puede
         * consultar sus propias reservas.
         */
        if (
            $usuario->rol?->nombre
            === 'Cliente'
        ) {
            $consulta->where(
                'usuario_id',
                $usuario->id
            );
        }

        /*
         * Filtro por estado.
         */
        if (
            ! empty(
                $datos['estado']
            )
        ) {
            $consulta->where(
                'estado',
                $datos['estado']
            );
        }

        /*
         * Búsqueda general.
         *
         * Busca por:
         * - código de reserva
         * - nombres del cliente
         * - apellidos del cliente
         * - correo
         * - película
         * - sala
         */
        if (
            ! empty(
                $datos['buscar']
            )
        ) {
            $termino =
                trim(
                    $datos['buscar']
                );

            $consulta->where(
                function (
                    Builder $query
                ) use (
                    $termino
                ): void {
                    $query
                        ->where(
                            'codigo',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhereHas(
                            'usuario',
                            function (
                                Builder $usuario
                            ) use (
                                $termino
                            ): void {
                                $usuario
                                    ->where(
                                        'nombres',
                                        'ilike',
                                        '%'
                                        . $termino
                                        . '%'
                                    )
                                    ->orWhere(
                                        'apellidos',
                                        'ilike',
                                        '%'
                                        . $termino
                                        . '%'
                                    )
                                    ->orWhere(
                                        'correo',
                                        'ilike',
                                        '%'
                                        . $termino
                                        . '%'
                                    );
                            }
                        )

                        ->orWhereHas(
                            'funcion.pelicula',
                            function (
                                Builder $pelicula
                            ) use (
                                $termino
                            ): void {
                                $pelicula->where(
                                    'titulo',
                                    'ilike',
                                    '%'
                                    . $termino
                                    . '%'
                                );
                            }
                        )

                        ->orWhereHas(
                            'funcion.sala',
                            function (
                                Builder $sala
                            ) use (
                                $termino
                            ): void {
                                $sala->where(
                                    'nombre',
                                    'ilike',
                                    '%'
                                    . $termino
                                    . '%'
                                );
                            }
                        );
                }
            );
        }

        $consulta->latest(
            'reservada_en'
        );

        /*
         * Sin paginar=1 conservamos
         * el comportamiento anterior.
         *
         * Esto evita afectar Taquilla u
         * otros consumidores del endpoint.
         */
        if (
            ! $request->boolean(
                'paginar'
            )
        ) {
            $reservas =
                $consulta->get();

            return response()->json([
                'message' =>
                    'Reservas obtenidas correctamente.',

                'data' =>
                    $reservas,
            ]);
        }

        $porPagina =
            (int) (
                $datos['per_page']
                ?? 20
            );

        $reservas =
            $consulta->paginate(
                $porPagina
            );

        return response()->json([
            'message' =>
                'Reservas obtenidas correctamente.',

            'data' =>
                $reservas->items(),

            'meta' => [
                'current_page' =>
                    $reservas
                        ->currentPage(),

                'last_page' =>
                    $reservas
                        ->lastPage(),

                'per_page' =>
                    $reservas
                        ->perPage(),

                'total' =>
                    $reservas
                        ->total(),

                'from' =>
                    $reservas
                        ->firstItem(),

                'to' =>
                    $reservas
                        ->lastItem(),
            ],
        ]);
    }

    /**
     * Crea una nueva reserva para
     * el usuario autenticado.
     */
    public function store(
        StoreReservaRequest $request
    ): JsonResponse {
        Gate::authorize(
            'create',
            Reserva::class
        );

        $usuario =
            $request->user();

        $datos =
            $request->validated();

        $datos['usuario_id'] =
            $usuario->id;

        if (
            $usuario->rol?->nombre
            === 'Cliente'
        ) {
            $datos['descuento'] = 0;
        }

        $reserva =
            $this
                ->reservaService
                ->crear(
                    $datos
                );

        return response()->json([
            'message' =>
                'Reserva creada correctamente.',

            'data' =>
                $reserva,
        ], 201);
    }

    /**
     * Muestra una reserva específica.
     */
    public function show(
        Reserva $reserva
    ): JsonResponse {
        Gate::authorize(
            'view',
            $reserva
        );

        $reserva->load([
            'usuario.rol',
            'funcion.pelicula',
            'funcion.sala',
            'funcion.formato',
            'detalles.funcionAsiento.asiento',
            'venta',
        ]);

        return response()->json([
            'message' =>
                'Reserva obtenida correctamente.',

            'data' =>
                $reserva,
        ]);
    }

    /**
     * Cancela administrativamente
     * una reserva pendiente.
     */
    public function cancelar(
        CancelarReservaRequest $request,
        Reserva $reserva
    ): JsonResponse {
        $reserva =
            $this
                ->reservaService
                ->cancelar(
                    $reserva,
                    $request
                        ->validated()[
                            'motivo_cancelacion'
                        ]
                );

        return response()->json([
            'message' =>
                'Reserva cancelada correctamente.',

            'data' =>
                $reserva,
        ]);
    }
}