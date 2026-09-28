<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFacturaRequest;
use App\Models\Factura;
use App\Models\Notificacion;
use App\Models\Venta;
use App\Services\FacturaService;
use App\Services\NotificacionService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class FacturaController extends Controller
{
    public function __construct(
        private readonly FacturaService $facturaService,
        private readonly NotificacionService $notificacionService
    ) {
    }

    /**
     * Lista las facturas autorizadas
     * para el usuario autenticado.
     *
     * Con paginar=1 habilita:
     * - búsqueda
     * - filtro por estado
     * - paginación administrativa
     *
     * Sin paginar=1 conserva el
     * comportamiento anterior.
     */
    public function index(
        Request $request
    ): JsonResponse {
        Gate::authorize(
            'viewAny',
            Factura::class
        );

        $datos =
            $request->validate([
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
                        'CERTIFICADA',
                        'ERROR',
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
            Factura::query()
                ->with([
                    'venta.cliente',
                    'venta.empleado',
                    'venta.funcion.pelicula',
                    'venta.funcion.sala',
                    'venta.funcion.formato',
                    'detalles.entrada.funcionAsiento.asiento',
                    'intentos',
                ]);

        if (
            $usuario->rol?->nombre
            === 'Cliente'
        ) {
            $consulta
                ->whereHas(
                    'venta',
                    function (
                        Builder $query
                    ) use (
                        $usuario
                    ): void {
                        $query->where(
                            'cliente_id',
                            $usuario->id
                        );
                    }
                );
        }

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
                            'numero_interno',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhere(
                            'serie',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhere(
                            'numero_documento',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhere(
                            'uuid',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhere(
                            'nit_receptor',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhere(
                            'nombre_receptor',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
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
                            'venta.cliente',
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
                        );
                }
            );
        }

        $consulta->latest('id');

        if (
            ! $request->boolean(
                'paginar'
            )
        ) {
            $facturas =
                $consulta->get();

            return response()->json([
                'message' =>
                    'Facturas obtenidas correctamente.',

                'data' =>
                    $facturas,
            ]);
        }

        $porPagina =
            (int) (
                $datos['per_page']
                ?? 20
            );

        $facturas =
            $consulta->paginate(
                $porPagina
            );

        return response()->json([
            'message' =>
                'Facturas obtenidas correctamente.',

            'data' =>
                $facturas->items(),

            'meta' => [
                'current_page' =>
                    $facturas
                        ->currentPage(),

                'last_page' =>
                    $facturas
                        ->lastPage(),

                'per_page' =>
                    $facturas
                        ->perPage(),

                'total' =>
                    $facturas
                        ->total(),

                'from' =>
                    $facturas
                        ->firstItem(),

                'to' =>
                    $facturas
                        ->lastItem(),
            ],
        ]);
    }

    /**
     * Obtiene ventas PAGADAS que todavía
     * no poseen una factura registrada.
     *
     * Se utilizarán como incidencias de
     * facturación y no como flujo normal.
     */
    public function ventasDisponibles(): JsonResponse
    {
        Gate::authorize(
            'create',
            Factura::class
        );

        $ventas =
            Venta::query()
                ->with([
                    'cliente',
                    'funcion.pelicula',
                ])
                ->where(
                    'estado',
                    'PAGADA'
                )
                ->whereNotIn(
                    'id',
                    Factura::query()
                        ->select(
                            'venta_id'
                        )
                )
                ->latest(
                    'realizada_en'
                )
                ->get();

        return response()->json([
            'message' =>
                'Ventas pendientes de facturación obtenidas correctamente.',

            'data' =>
                $ventas,
        ]);
    }

    /**
     * Genera una factura faltante para
     * una venta PAGADA que todavía no
     * posee factura.
     *
     * Este endpoint queda disponible
     * como mecanismo administrativo
     * de recuperación.
     */
    public function store(
        StoreFacturaRequest $request
    ): JsonResponse {
        Gate::authorize(
            'create',
            Factura::class
        );

        $datos =
            $request->validated();

        $venta =
            Venta::query()
                ->with(
                    'cliente'
                )
                ->findOrFail(
                    (int)
                    $datos[
                        'venta_id'
                    ]
                );

        Gate::authorize(
            'generarParaVenta',
            [
                Factura::class,
                $venta,
            ]
        );

        $factura =
            $this
                ->facturaService
                ->generar(
                    $venta->id,
                    [
                        'nit_receptor' =>
                            $datos[
                                'nit_receptor'
                            ],

                        'nombre_receptor' =>
                            $datos[
                                'nombre_receptor'
                            ],
                    ]
                );

        $correoEnviado =
            $this
                ->enviarFacturaCertificada(
                    $factura
                );

        return response()->json([
            'message' =>
                $correoEnviado
                    ? 'Factura electrónica generada, certificada y enviada por correo correctamente.'
                    : 'Factura electrónica generada y certificada correctamente. No fue posible enviar el correo, pero la factura continúa siendo válida.',

            'data' =>
                $factura,

            'correo_enviado' =>
                $correoEnviado,
        ], 201);
    }

    /**
     * Reintenta la certificación FEL de
     * una factura existente en estado ERROR.
     *
     * No crea una nueva factura.
     *
     * Crea un nuevo FacturaIntento y
     * vuelve a comunicarse con Digifact.
     */
    public function reintentar(
        Factura $factura
    ): JsonResponse {
        $factura->load(
            'venta'
        );

        if (
            ! $factura->venta
        ) {
            return response()->json([
                'message' =>
                    'La factura no posee una venta asociada.',
            ], 422);
        }

        Gate::authorize(
            'generarParaVenta',
            [
                Factura::class,
                $factura->venta,
            ]
        );

        $facturaCertificada =
            $this
                ->facturaService
                ->reintentar(
                    $factura->id
                );

        $correoEnviado =
            $this
                ->enviarFacturaCertificada(
                    $facturaCertificada
                );

        return response()->json([
            'message' =>
                $correoEnviado
                    ? 'La factura fue certificada correctamente y enviada por correo.'
                    : 'La factura fue certificada correctamente. No fue posible enviar el correo, pero la factura continúa siendo válida.',

            'data' =>
                $facturaCertificada,

            'correo_enviado' =>
                $correoEnviado,
        ]);
    }

    /**
     * Muestra una factura específica.
     */
    public function show(
        Factura $factura
    ): JsonResponse {
        Gate::authorize(
            'view',
            $factura
        );

        $factura->load([
            'venta.cliente',
            'venta.empleado',
            'venta.funcion.pelicula',
            'venta.funcion.sala',
            'venta.funcion.formato',
            'detalles.entrada.funcionAsiento.asiento',
            'intentos',
        ]);

        return response()->json([
            'message' =>
                'Factura obtenida correctamente.',

            'data' =>
                $factura,
        ]);
    }

    /**
     * Devuelve el PDF certificado por
     * Digifact.
     *
     * Con ?descargar=1 se fuerza la
     * descarga.
     *
     * Sin ese parámetro el navegador
     * puede mostrar el PDF.
     */
    public function pdf(
        Request $request,
        Factura $factura
    ): Response|JsonResponse {
        Gate::authorize(
            'view',
            $factura
        );

        if (
            $factura->estado
            !== 'CERTIFICADA'
        ) {
            return response()->json([
                'message' =>
                    'La factura todavía no se encuentra certificada.',
            ], 422);
        }

        $base64 =
            $this
                ->obtenerDocumentoBase64(
                    $factura,
                    'pdf_base64'
                );

        if (! $base64) {
            return response()->json([
                'message' =>
                    'El PDF certificado no se encuentra almacenado para esta factura.',
            ], 404);
        }

        $contenido =
            $this
                ->decodificarBase64(
                    $base64
                );

        if (
            $contenido === null
        ) {
            return response()->json([
                'message' =>
                    'El PDF almacenado no pudo ser interpretado.',
            ], 500);
        }

        $nombre =
            $this
                ->nombreArchivo(
                    $factura,
                    'pdf'
                );

        $disposicion =
            $request->boolean(
                'descargar'
            )
                ? 'attachment'
                : 'inline';

        return response(
            $contenido,
            200,
            [
                'Content-Type' =>
                    'application/pdf',

                'Content-Disposition' =>
                    $disposicion
                    . '; filename="'
                    . $nombre
                    . '"',

                'Content-Length' =>
                    (string)
                    strlen(
                        $contenido
                    ),

                'Cache-Control' =>
                    'private, no-store, no-cache, must-revalidate',
            ]
        );
    }

    /**
     * Devuelve el XML certificado
     * por Digifact.
     */
    public function xml(
        Factura $factura
    ): Response|JsonResponse {
        Gate::authorize(
            'view',
            $factura
        );

        if (
            $factura->estado
            !== 'CERTIFICADA'
        ) {
            return response()->json([
                'message' =>
                    'La factura todavía no se encuentra certificada.',
            ], 422);
        }

        $base64 =
            $this
                ->obtenerDocumentoBase64(
                    $factura,
                    'xml_base64'
                );

        if (! $base64) {
            return response()->json([
                'message' =>
                    'El XML certificado no se encuentra almacenado para esta factura.',
            ], 404);
        }

        $contenido =
            $this
                ->decodificarBase64(
                    $base64
                );

        if (
            $contenido === null
        ) {
            return response()->json([
                'message' =>
                    'El XML almacenado no pudo ser interpretado.',
            ], 500);
        }

        $nombre =
            $this
                ->nombreArchivo(
                    $factura,
                    'xml'
                );

        return response(
            $contenido,
            200,
            [
                'Content-Type' =>
                    'application/xml; charset=UTF-8',

                'Content-Disposition' =>
                    'attachment; filename="'
                    . $nombre
                    . '"',

                'Content-Length' =>
                    (string)
                    strlen(
                        $contenido
                    ),

                'Cache-Control' =>
                    'private, no-store, no-cache, must-revalidate',
            ]
        );
    }

    /**
     * Intenta enviar por correo una
     * factura ya certificada.
     *
     * El fallo de correo nunca revierte:
     *
     * - la venta;
     * - la factura;
     * - la certificación FEL.
     */
    private function enviarFacturaCertificada(
        Factura $factura
    ): bool {
        try {
            $factura->loadMissing(
                'venta.cliente'
            );

            if (
                $factura->estado
                !== 'CERTIFICADA'
            ) {
                return false;
            }

            $venta =
                $factura->venta;

            $cliente =
                $venta?->cliente;

            if (
                ! $venta
                || ! $cliente
                || blank(
                    $cliente->correo
                )
            ) {
                Log::warning(
                    'La factura fue certificada, pero no existe un correo de cliente para enviarla.',
                    [
                        'factura_id' =>
                            $factura->id,

                        'venta_id' =>
                            $venta?->id,
                    ]
                );

                return false;
            }

            /*
             * Evitamos crear varias
             * notificaciones pendientes
             * de la misma factura.
             */
            $notificacion =
                Notificacion::query()
                    ->where(
                        'factura_id',
                        $factura->id
                    )
                    ->where(
                        'canal',
                        'EMAIL'
                    )
                    ->whereIn(
                        'estado',
                        [
                            'PENDIENTE',
                            'ERROR',
                        ]
                    )
                    ->latest('id')
                    ->first();

            if (! $notificacion) {
                $identificador =
                    $factura->serie
                    && $factura->numero_documento
                        ? $factura->serie
                            . '-'
                            . $factura->numero_documento
                        : $factura->numero_interno;

                $notificacion =
                    Notificacion::query()
                        ->create([
                            'usuario_id' =>
                                $cliente->id,

                            'venta_id' =>
                                $venta->id,

                            'reserva_id' =>
                                $venta->reserva_id,

                            'factura_id' =>
                                $factura->id,

                            'ticket_id' =>
                                null,

                            'canal' =>
                                'EMAIL',

                            'destinatario' =>
                                $cliente->correo,

                            'asunto' =>
                                'Factura electrónica de Atlantic Cinema',

                            'mensaje' =>
                                sprintf(
                                    'Tu factura electrónica %s correspondiente a la venta %s fue certificada correctamente y se encuentra adjunta en formato PDF.',
                                    $identificador,
                                    $venta->numero_venta
                                ),

                            'estado' =>
                                'PENDIENTE',

                            'enviada_en' =>
                                null,

                            'leida_en' =>
                                null,
                        ]);
            }

            /*
             * Si previamente quedó ERROR,
             * NotificacionService permite
             * reprocesarla.
             */
            $this
                ->notificacionService
                ->procesar(
                    $notificacion->id
                );

            return true;
        } catch (
            \Throwable $exception
        ) {
            Log::error(
                'La factura fue certificada, pero no fue posible enviar el correo electrónico.',
                [
                    'factura_id' =>
                        $factura->id,

                    'venta_id' =>
                        $factura->venta_id,

                    'error' =>
                        $exception
                            ->getMessage(),
                ]
            );

            return false;
        }
    }

    /**
     * Obtiene un documento almacenado
     * dentro de datos_proveedor.
     */
    private function obtenerDocumentoBase64(
        Factura $factura,
        string $clave
    ): ?string {
        $datos =
            $factura
                ->datos_proveedor;

        if (
            is_string(
                $datos
            )
        ) {
            $datos =
                json_decode(
                    $datos,
                    true
                );
        }

        if (
            ! is_array(
                $datos
            )
        ) {
            return null;
        }

        $valor =
            $datos[
                $clave
            ] ?? null;

        if (
            ! is_string(
                $valor
            )
            || trim(
                $valor
            ) === ''
        ) {
            return null;
        }

        return trim(
            $valor
        );
    }

    /**
     * Decodifica Base64 de forma estricta.
     *
     * También admite valores con prefijo:
     *
     * data:...;base64,
     */
    private function decodificarBase64(
        string $base64
    ): ?string {
        if (
            str_contains(
                $base64,
                'base64,'
            )
        ) {
            $partes =
                explode(
                    'base64,',
                    $base64,
                    2
                );

            $base64 =
                $partes[1]
                ?? '';
        }

        $contenido =
            base64_decode(
                $base64,
                true
            );

        if (
            $contenido === false
        ) {
            return null;
        }

        return $contenido;
    }

    /**
     * Genera nombres seguros para
     * los documentos descargables.
     */
    private function nombreArchivo(
        Factura $factura,
        string $extension
    ): string {
        $identificador =
            $factura->serie
            && $factura->numero_documento
                ? $factura->serie
                    . '-'
                    . $factura->numero_documento
                : $factura->numero_interno;

        $identificador =
            preg_replace(
                '/[^A-Za-z0-9_-]/',
                '-',
                (string)
                $identificador
            );

        return
            'Factura-Atlantic-Cinema-'
            . $identificador
            . '.'
            . $extension;
    }
}