<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProcesarNotificacionRequest;
use App\Models\Notificacion;
use App\Services\NotificacionService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class NotificacionController extends Controller
{
    public function __construct(
        private readonly NotificacionService $notificacionService
    ) {
    }

    /**
     * Lista las notificaciones autorizadas
     * para el usuario autenticado.
     *
     * Sin paginar=1 conserva el comportamiento
     * anterior.
     *
     * Con paginar=1 habilita:
     * - búsqueda
     * - filtro por estado
     * - filtro por canal
     * - paginación administrativa
     */
    public function index(
        Request $request
    ): JsonResponse {
        Gate::authorize(
            'viewAny',
            Notificacion::class
        );

        $datos = $request->validate([
            'buscar' => [
                'nullable',
                'string',
                'max:180',
            ],

            'estado' => [
                'nullable',
                'string',
                Rule::in([
                    'PENDIENTE',
                    'ENVIADA',
                    'ERROR',
                ]),
            ],

            'canal' => [
                'nullable',
                'string',
                'max:50',
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

        /*
         * Consulta base autorizada.
         *
         * Se carga también venta.factura
         * para poder resolver la factura
         * relacionada aunque factura_id
         * de la notificación sea NULL.
         */
        $consulta =
            Notificacion::query()
                ->with([
                    'usuario',
                    'venta.factura',
                    'reserva',
                    'factura',
                    'ticket',
                ]);

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
         * Obtenemos los canales antes
         * de aplicar el filtro por canal.
         */
        $consultaCanales =
            Notificacion::query();

        if (
            $usuario->rol?->nombre
            === 'Cliente'
        ) {
            $consultaCanales->where(
                'usuario_id',
                $usuario->id
            );
        }

        $canales =
            $consultaCanales
                ->whereNotNull('canal')
                ->where(
                    'canal',
                    '<>',
                    ''
                )
                ->distinct()
                ->orderBy('canal')
                ->pluck('canal')
                ->values();

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
         * Filtro por canal.
         */
        if (
            ! empty(
                $datos['canal']
            )
        ) {
            $consulta->where(
                'canal',
                $datos['canal']
            );
        }

        /*
         * Búsqueda general.
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
                            'destinatario',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhere(
                            'asunto',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhere(
                            'mensaje',
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
                            'venta',
                            function (
                                Builder $venta
                            ) use (
                                $termino
                            ): void {
                                $venta->where(
                                    'numero_venta',
                                    'ilike',
                                    '%'
                                    . $termino
                                    . '%'
                                );
                            }
                        )

                        ->orWhereHas(
                            'reserva',
                            function (
                                Builder $reserva
                            ) use (
                                $termino
                            ): void {
                                $reserva->where(
                                    'codigo',
                                    'ilike',
                                    '%'
                                    . $termino
                                    . '%'
                                );
                            }
                        )

                        ->orWhereHas(
                            'factura',
                            function (
                                Builder $factura
                            ) use (
                                $termino
                            ): void {
                                $factura->where(
                                    'numero_interno',
                                    'ilike',
                                    '%'
                                    . $termino
                                    . '%'
                                );
                            }
                        )

                        /*
                         * También permite buscar
                         * por la factura perteneciente
                         * a la venta de la notificación.
                         */
                        ->orWhereHas(
                            'venta.factura',
                            function (
                                Builder $factura
                            ) use (
                                $termino
                            ): void {
                                $factura->where(
                                    'numero_interno',
                                    'ilike',
                                    '%'
                                    . $termino
                                    . '%'
                                );
                            }
                        )

                        ->orWhereHas(
                            'ticket',
                            function (
                                Builder $ticket
                            ) use (
                                $termino
                            ): void {
                                $ticket->where(
                                    'codigo',
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

        $consulta->latest('id');

        /*
         * Compatibilidad con el flujo
         * anterior y con Cliente.
         */
        if (
            ! $request->boolean(
                'paginar'
            )
        ) {
            $notificaciones =
                $consulta->get();

            $notificaciones
                ->each(
                    fn (Notificacion $notificacion) =>
                        $this->resolverFacturaRelacionada(
                            $notificacion
                        )
                );

            return response()->json([
                'message' =>
                    'Notificaciones obtenidas correctamente.',

                'data' =>
                    $notificaciones,
            ]);
        }

        $porPagina =
            (int) (
                $datos['per_page']
                ?? 20
            );

        $notificaciones =
            $consulta->paginate(
                $porPagina
            );

        /*
         * Si la notificación no posee
         * factura_id propio, se expone
         * la factura de su venta.
         */
        collect(
            $notificaciones->items()
        )->each(
            fn (Notificacion $notificacion) =>
                $this->resolverFacturaRelacionada(
                    $notificacion
                )
        );

        return response()->json([
            'message' =>
                'Notificaciones obtenidas correctamente.',

            'data' =>
                $notificaciones->items(),

            'meta' => [
                'current_page' =>
                    $notificaciones
                        ->currentPage(),

                'last_page' =>
                    $notificaciones
                        ->lastPage(),

                'per_page' =>
                    $notificaciones
                        ->perPage(),

                'total' =>
                    $notificaciones
                        ->total(),

                'from' =>
                    $notificaciones
                        ->firstItem(),

                'to' =>
                    $notificaciones
                        ->lastItem(),
            ],

            'filtros' => [
                'canales' =>
                    $canales,
            ],
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

        $notificacion =
            $this
                ->notificacionService
                ->procesar(
                    (int)
                    $request->validated(
                        'notificacion_id'
                    )
                );

        /*
         * El servicio puede devolver
         * solamente la venta sin su factura.
         * La cargamos para mantener la misma
         * estructura del endpoint show().
         */
        $notificacion->loadMissing([
            'usuario',
            'venta.factura',
            'reserva',
            'factura',
            'ticket',
        ]);

        $this->resolverFacturaRelacionada(
            $notificacion
        );

        return response()->json([
            'message' =>
                'Notificación procesada correctamente.',

            'data' =>
                $notificacion,
        ]);
    }

    /**
     * Muestra una notificación específica.
     */
    public function show(
        Notificacion $notificacion
    ): JsonResponse {
        Gate::authorize(
            'view',
            $notificacion
        );

        $notificacion->load([
            'usuario',
            'venta.factura',
            'reserva',
            'factura',
            'ticket',
        ]);

        /*
         * Las notificaciones de ticket se
         * crearon históricamente con:
         *
         * factura_id = NULL
         *
         * Sin embargo, tienen venta_id.
         *
         * Si la venta posee factura, se
         * presenta esa factura como relación
         * de la notificación sin modificar
         * la base de datos.
         */
        $this->resolverFacturaRelacionada(
            $notificacion
        );

        return response()->json([
            'message' =>
                'Notificación obtenida correctamente.',

            'data' =>
                $notificacion,
        ]);
    }

    /**
     * Resuelve la factura relacionada.
     *
     * Prioridad:
     *
     * 1. factura directamente asociada
     *    a la notificación.
     *
     * 2. factura perteneciente a la venta.
     *
     * No modifica factura_id en la base
     * de datos. Únicamente establece la
     * relación que se serializará en JSON.
     */
    private function resolverFacturaRelacionada(
        Notificacion $notificacion
    ): Notificacion {
        if (
            $notificacion->factura
            !== null
        ) {
            return $notificacion;
        }

        $facturaVenta =
            $notificacion
                ->venta
                ?->factura;

        if (
            $facturaVenta
            !== null
        ) {
            $notificacion->setRelation(
                'factura',
                $facturaVenta
            );
        }

        return $notificacion;
    }
}