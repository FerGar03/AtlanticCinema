<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActualizarFacturacionVentaRequest;
use App\Http\Requests\ComprarEntradaRequest;
use App\Http\Requests\ConvertirReservaVentaRequest;
use App\Http\Requests\VentaTaquillaRequest;
use App\Models\Reserva;
use App\Models\Venta;
use App\Services\Fel\DigifactFelService;
use App\Services\VentaService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class VentaController extends Controller
{
    public function __construct(
        private readonly VentaService $ventaService,
        private readonly DigifactFelService $digifactFelService
    ) {
    }

    public function index(
        Request $request
    ): JsonResponse {
        Gate::authorize(
            'viewAny',
            Venta::class
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
                    'PAGADA',
                    'FALLIDA',
                    'CANCELADA',
                    'REEMBOLSADA',
                    'PARCIALMENTE_REEMBOLSADA',
                ]),
            ],

            'origen' => [
                'nullable',
                'string',
                Rule::in([
                    'COMPRA_WEB',
                    'TAQUILLA',
                    'RESERVA',
                ]),
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
            Venta::query()
                ->with([
                    'cliente',
                    'empleado',
                    'reserva',
                    'funcion.pelicula',
                    'funcion.sala',
                    'funcion.formato',
                    'entradas.funcionAsiento.asiento',
                ]);

        /*
         * Un cliente solamente puede
         * consultar sus propias ventas.
         */
        if (
            $usuario->rol?->nombre
            === 'Cliente'
        ) {
            $consulta->where(
                'cliente_id',
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
         * Filtro por origen.
         */
        if (
            ! empty(
                $datos['origen']
            )
        ) {
            $consulta->where(
                'origen',
                $datos['origen']
            );
        }

        /*
         * Búsqueda general.
         *
         * Permite buscar por:
         * - número de venta
         * - cliente
         * - correo
         * - película
         * - sala
         * - código de reserva
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
                            'numero_venta',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhereHas(
                            'cliente',
                            function (
                                Builder $cliente
                            ) use (
                                $termino
                            ): void {
                                $cliente
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
                        );
                }
            );
        }

        $porPagina =
            (int) (
                $datos['per_page']
                ?? 20
            );

        $ventas =
            $consulta
                ->latest(
                    'realizada_en'
                )
                ->paginate(
                    $porPagina
                );

        return response()->json([
            'message' =>
                'Ventas obtenidas correctamente.',

            'data' =>
                $ventas->items(),

            'meta' => [
                'current_page' =>
                    $ventas
                        ->currentPage(),

                'last_page' =>
                    $ventas
                        ->lastPage(),

                'per_page' =>
                    $ventas
                        ->perPage(),

                'total' =>
                    $ventas
                        ->total(),

                'from' =>
                    $ventas
                        ->firstItem(),

                'to' =>
                    $ventas
                        ->lastItem(),
            ],
        ]);
    }

    /**
     * Compra directa realizada desde
     * la aplicación web por un cliente.
     */
    public function storeDirecta(
        ComprarEntradaRequest $request
    ): JsonResponse {
        Gate::authorize(
            'create',
            Venta::class
        );

        $usuario =
            $request->user();

        $datos =
            $request->validated();

        $venta =
            $this
                ->ventaService
                ->crearDirecta(
                    clienteId:
                        $usuario->id,

                    funcionId:
                        (int)
                        $datos[
                            'funcion_id'
                        ],

                    funcionAsientoIds:
                        $datos[
                            'funcion_asiento_ids'
                        ],
                );

        return response()->json([
            'message' =>
                'Compra iniciada correctamente.',

            'data' =>
                $venta,
        ], 201);
    }

    /**
     * Registra una venta presencial
     * realizada por personal de taquilla.
     */
    public function storeTaquilla(
        VentaTaquillaRequest $request
    ): JsonResponse {
        Gate::authorize(
            'create',
            Venta::class
        );

        $usuario =
            $request->user();

        $datos =
            $request->validated();

        $venta =
            $this
                ->ventaService
                ->crearTaquilla(
                    empleadoId:
                        $usuario->id,

                    funcionId:
                        (int)
                        $datos[
                            'funcion_id'
                        ],

                    funcionAsientoIds:
                        $datos[
                            'funcion_asiento_ids'
                        ],

                    clienteId:
                        isset(
                            $datos[
                                'cliente_id'
                            ]
                        )
                            ? (int)
                                $datos[
                                    'cliente_id'
                                ]
                            : null,
                );

        return response()->json([
            'message' =>
                'Venta de taquilla creada correctamente.',

            'data' =>
                $venta,
        ], 201);
    }

    public function storeDesdeReserva(
        ConvertirReservaVentaRequest $request
    ): JsonResponse {
        $usuario =
            $request->user();

        $reserva =
            Reserva::query()
                ->findOrFail(
                    $request->integer(
                        'reserva_id'
                    )
                );

        Gate::authorize(
            'convertirEnVenta',
            $reserva
        );

        $empleadoId =
            in_array(
                $usuario->rol?->nombre,
                [
                    'Administrador',
                    'Empleado',
                ],
                true
            )
                ? $usuario->id
                : null;

        $venta =
            $this
                ->ventaService
                ->crearDesdeReserva(
                    reservaId:
                        $reserva->id,

                    empleadoId:
                        $empleadoId,
                );

        return response()->json([
            'message' =>
                'Reserva convertida en venta correctamente.',

            'data' =>
                $venta,
        ], 201);
    }

    /**
     * Guarda los datos fiscales que serán
     * utilizados cuando la compra sea
     * certificada después del pago.
     */
    public function actualizarFacturacion(
        ActualizarFacturacionVentaRequest $request,
        Venta $venta
    ): JsonResponse {
        Gate::authorize(
            'view',
            $venta
        );

        if (
            $venta->origen
            !== 'COMPRA_WEB'
        ) {
            throw ValidationException::withMessages([
                'venta' => [
                    'Los datos de facturación solamente pueden modificarse desde una compra web.',
                ],
            ]);
        }

        if (
            $venta->estado
            !== 'PENDIENTE'
        ) {
            throw ValidationException::withMessages([
                'venta' => [
                    'Los datos de facturación solamente pueden modificarse antes de completar el pago.',
                ],
            ]);
        }

        /*
         * Una vez creado cualquier intento de
         * pago ya no permitimos modificar la
         * identidad fiscal del receptor.
         */
        if (
            $venta
                ->pagos()
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'venta' => [
                    'Los datos de facturación ya no pueden modificarse porque el proceso de pago fue iniciado.',
                ],
            ]);
        }

        $datos =
            $request->validated();

        if (
            $datos[
                'tipo_facturacion'
            ] === 'CF'
        ) {
            $venta->update([
                'nit_facturacion' =>
                    'CF',

                'nombre_facturacion' =>
                    'Consumidor Final',
            ]);

            return response()->json([
                'message' =>
                    'Facturación configurada como Consumidor Final.',

                'data' =>
                    $venta->fresh([
                        'cliente',
                        'funcion.pelicula',
                        'funcion.sala',
                        'funcion.formato',
                        'entradas.funcionAsiento.asiento',
                    ]),
            ]);
        }

        try {
            $informacionNit =
                $this
                    ->digifactFelService
                    ->consultarNit(
                        $datos['nit']
                    );
        } catch (Throwable $exception) {
            throw ValidationException::withMessages([
                'nit' => [
                    $exception->getMessage(),
                ],
            ]);
        }

        $venta->update([
            'nit_facturacion' =>
                $informacionNit[
                    'nit'
                ],

            /*
             * Conservamos exactamente el nombre
             * oficial devuelto por Digifact.
             *
             * La presentación más legible se
             * realizará en el frontend.
             */
            'nombre_facturacion' =>
                $informacionNit[
                    'nombre'
                ],
        ]);

        return response()->json([
            'message' =>
                'Datos de facturación verificados correctamente.',

            'data' =>
                $venta->fresh([
                    'cliente',
                    'funcion.pelicula',
                    'funcion.sala',
                    'funcion.formato',
                    'entradas.funcionAsiento.asiento',
                ]),
        ]);
    }

    public function show(
        Venta $venta
    ): JsonResponse {
        Gate::authorize(
            'view',
            $venta
        );

        $venta->load([
    'cliente',
    'empleado',
    'reserva',
    'funcion.pelicula',
    'funcion.sala',
    'funcion.formato',
    'entradas.funcionAsiento.asiento',
    'factura',
]);

        return response()->json([
            'message' =>
                'Venta obtenida correctamente.',

            'data' =>
                $venta,
        ]);
    }
}