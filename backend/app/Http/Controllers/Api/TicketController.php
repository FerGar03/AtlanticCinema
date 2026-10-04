<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GenerarTicketRequest;
use App\Http\Requests\ValidarTicketRequest;
use App\Models\Notificacion;
use App\Models\Ticket;
use App\Models\Venta;
use App\Services\NotificacionService;
use App\Services\TicketService;
use Barryvdh\DomPDF\Facade\Pdf;
use Dompdf\Adapter\CPDF;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class TicketController extends Controller
{
    public function __construct(
        private readonly TicketService $ticketService,
        private readonly NotificacionService $notificacionService
    ) {
    }

    /**
     * Lista los tickets autorizados
     * para el usuario autenticado.
     */
    public function index(
        Request $request
    ): JsonResponse {
        Gate::authorize(
            'viewAny',
            Ticket::class
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
                    'ACTIVO',
                    'UTILIZADO',
                    'CANCELADO',
                    'INVALIDADO',
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
            Ticket::query()
                ->with([
                    'entrada.venta.cliente',
                    'entrada.venta.empleado',
                    'entrada.funcionAsiento.asiento',
                    'entrada.funcionAsiento.funcion.pelicula',
                    'entrada.funcionAsiento.funcion.sala',
                    'entrada.funcionAsiento.funcion.formato',
                    'notificaciones',
                ]);

        if (
            $usuario->rol?->nombre
            === 'Cliente'
        ) {
            $consulta->whereHas(
                'entrada.venta',
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
                            'codigo',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhereHas(
                            'entrada.venta',
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
                            'entrada.venta.cliente',
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
                            'entrada.funcionAsiento.funcion.pelicula',
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
                            'entrada.funcionAsiento.funcion.sala',
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
            'generado_en'
        );

        if (
            ! $request->boolean(
                'paginar'
            )
        ) {
            $tickets =
                $consulta->get();

            return response()->json([
                'message' =>
                    'Tickets obtenidos correctamente.',

                'data' =>
                    $tickets,
            ]);
        }

        $porPagina =
            (int) (
                $datos['per_page']
                ?? 20
            );

        $tickets =
            $consulta->paginate(
                $porPagina
            );

        return response()->json([
            'message' =>
                'Tickets obtenidos correctamente.',

            'data' =>
                $tickets->items(),

            'meta' => [
                'current_page' =>
                    $tickets
                        ->currentPage(),

                'last_page' =>
                    $tickets
                        ->lastPage(),

                'per_page' =>
                    $tickets
                        ->perPage(),

                'total' =>
                    $tickets
                        ->total(),

                'from' =>
                    $tickets
                        ->firstItem(),

                'to' =>
                    $tickets
                        ->lastItem(),
            ],
        ]);
    }

    /**
     * Obtiene únicamente ventas PAGADAS
     * que realmente tengan tickets faltantes.
     *
     * Una entrada requiere recuperación
     * cuando:
     *
     * - está en estado VALIDA;
     * - no posee ticket ACTIVO;
     * - no posee ticket UTILIZADO.
     */
    public function ventasDisponibles(): JsonResponse
    {
        Gate::authorize(
            'create',
            Ticket::class
        );

        $ventas =
            Venta::query()
                ->with([
                    'cliente',
                    'funcion.pelicula',
                    'funcion.sala',
                    'funcion.formato',
                    'entradas',
                ])
                ->where(
                    'estado',
                    'PAGADA'
                )
                ->whereHas(
                    'entradas',
                    function (
                        Builder $query
                    ): void {
                        $query->where(
                            'estado',
                            'VALIDA'
                        );
                    }
                )
                ->latest(
                    'realizada_en'
                )
                ->get();

        /*
         * TicketService conoce la regla
         * exacta para determinar si una
         * entrada necesita recuperación.
         *
         * Esto evita duplicar la lógica
         * del módulo en el controlador.
         */
        $ventasConFaltantes =
            $ventas
                ->map(
                    function (
                        Venta $venta
                    ): Venta {
                        $faltantes =
                            $this
                                ->ticketService
                                ->contarFaltantes(
                                    $venta
                                );

                        $venta->setAttribute(
                            'tickets_faltantes',
                            $faltantes
                        );

                        return $venta;
                    }
                )
                ->filter(
                    fn (
                        Venta $venta
                    ): bool =>
                        (int)
                        $venta
                            ->tickets_faltantes
                        > 0
                )
                ->values();

        return response()->json([
            'message' =>
                'Incidencias de tickets obtenidas correctamente.',

            'data' =>
                $ventasConFaltantes,
        ]);
    }

    /**
     * Genera únicamente los tickets
     * faltantes de una venta PAGADA.
     *
     * Después intenta procesar las
     * notificaciones EMAIL creadas.
     *
     * Un error de correo nunca elimina
     * ni invalida los tickets generados.
     */
    public function store(
        GenerarTicketRequest $request
    ): JsonResponse {
        Gate::authorize(
            'create',
            Ticket::class
        );

        $venta =
            Venta::query()
                ->with([
                    'cliente',
                    'entradas',
                ])
                ->findOrFail(
                    $request->integer(
                        'venta_id'
                    )
                );

        Gate::authorize(
            'generarParaVenta',
            [
                Ticket::class,
                $venta,
            ]
        );

        $faltantesAntes =
            $this
                ->ticketService
                ->contarFaltantes(
                    $venta
                );

        if (
            $faltantesAntes <= 0
        ) {
            return response()->json([
                'message' =>
                    'La venta no posee tickets faltantes.',

                'data' =>
                    [],

                'tickets_generados' =>
                    0,

                'correos_enviados' =>
                    0,

                'correos_error' =>
                    0,
            ]);
        }

        $tickets =
            $this
                ->ticketService
                ->generarParaVenta(
                    $venta->id
                );

        /*
         * TicketService crea ahora una sola
         * notificación EMAIL por la operación
         * de generación de tickets.
         *
         * Esa notificación pertenece a la venta
         * y NotificacionService adjunta todos los
         * tickets disponibles más la factura FEL
         * cuando corresponda.
         */
        $notificacion =
            Notificacion::query()
                ->where(
                    'venta_id',
                    $venta->id
                )
                ->whereNull(
                    'ticket_id'
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

        $correosEnviados =
            0;

        $correosError =
            0;

        if ($notificacion) {
            try {
                $this
                    ->notificacionService
                    ->procesar(
                        $notificacion->id
                    );

                $correosEnviados =
                    1;
            } catch (
                Throwable $exception
            ) {
                $correosError =
                    1;

                Log::error(
                    'Los tickets fueron generados, pero no fue posible enviar el correo unificado de la venta.',
                    [
                        'venta_id' =>
                            $venta->id,

                        'notificacion_id' =>
                            $notificacion
                                ->id,

                        'error' =>
                            $exception
                                ->getMessage(),
                    ]
                );
            }
        }

        /*
         * Volvemos a consultar para devolver
         * la información actualizada.
         */
        $ticketsActualizados =
            Ticket::query()
                ->with([
                    'entrada.venta.cliente',
                    'entrada.funcionAsiento.asiento',
                    'entrada.funcionAsiento.funcion.pelicula',
                    'entrada.funcionAsiento.funcion.sala',
                    'entrada.funcionAsiento.funcion.formato',
                    'notificaciones',
                ])
                ->whereIn(
                    'id',
                    $tickets
                        ->pluck(
                            'id'
                        )
                )
                ->get();

        $mensaje =
            'Tickets faltantes generados correctamente.';

        if (
            $correosError > 0
        ) {
            $mensaje .=
                ' El correo unificado de la venta no pudo enviarse, pero los tickets continúan siendo válidos.';
        } elseif (
            $correosEnviados > 0
        ) {
            $mensaje .=
                ' Se envió un único correo con los documentos disponibles de la venta.';
        }

        return response()->json([
            'message' =>
                $mensaje,

            'data' =>
                $ticketsActualizados,

            'tickets_generados' =>
                $faltantesAntes,

            'correos_enviados' =>
                $correosEnviados,

            'correos_error' =>
                $correosError,
        ], 201);
    }

    /**
     * Muestra un ticket específico.
     */
    public function show(
        Ticket $ticket
    ): JsonResponse {
        Gate::authorize(
            'view',
            $ticket
        );

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

            'data' =>
                $ticket,
        ]);
    }

    /**
     * Genera el PDF del ticket.
     *
     * Sin ?descargar=1:
     * se muestra inline.
     *
     * Con ?descargar=1:
     * fuerza la descarga.
     */
    public function pdf(
        Request $request,
        Ticket $ticket
    ): Response {
        Gate::authorize(
            'view',
            $ticket
        );

        $ticket->load([
            'entrada.venta.cliente',
            'entrada.funcionAsiento.asiento',
            'entrada.funcionAsiento.funcion.pelicula',
            'entrada.funcionAsiento.funcion.sala',
            'entrada.funcionAsiento.funcion.formato',
        ]);

        if (! $ticket->entrada) {
            abort(
                422,
                'El ticket no posee una entrada asociada.'
            );
        }

        if (
            ! $ticket
                ->entrada
                ->funcionAsiento
        ) {
            abort(
                422,
                'No fue posible obtener el asiento asociado al ticket.'
            );
        }

        if (
            ! is_string(
                $ticket->token_validacion
            )
            || trim(
                $ticket->token_validacion
            ) === ''
        ) {
            abort(
                422,
                'El ticket no posee un token de validación.'
            );
        }

        /*
         * 1. Generar QR con Endroid.
         */
        $qrCode =
            new QrCode(
                data:
                    $ticket
                        ->token_validacion,

                encoding:
                    new Encoding(
                        'UTF-8'
                    ),

                errorCorrectionLevel:
                    ErrorCorrectionLevel::High,

                size:
                    400,

                margin:
                    20,

                roundBlockSizeMode:
                    RoundBlockSizeMode::Margin
            );

        $writer =
            new PngWriter();

        $resultadoQr =
            $writer->write(
                $qrCode
            );

        /*
         * 2. Convertir PNG a JPEG
         * mediante GD.
         *
         * Esto permite insertar después
         * el QR directamente con CPDF.
         */
        $imagenPng =
            imagecreatefromstring(
                $resultadoQr->getString()
            );

        if (
            $imagenPng === false
        ) {
            abort(
                500,
                'No fue posible procesar el código QR.'
            );
        }

        $anchoImagen =
            imagesx(
                $imagenPng
            );

        $altoImagen =
            imagesy(
                $imagenPng
            );

        $imagenJpeg =
            imagecreatetruecolor(
                $anchoImagen,
                $altoImagen
            );

        if (
            $imagenJpeg === false
        ) {
            imagedestroy(
                $imagenPng
            );

            abort(
                500,
                'No fue posible preparar el código QR.'
            );
        }

        $blanco =
            imagecolorallocate(
                $imagenJpeg,
                255,
                255,
                255
            );

        imagefill(
            $imagenJpeg,
            0,
            0,
            $blanco
        );

        imagecopy(
            $imagenJpeg,
            $imagenPng,
            0,
            0,
            0,
            0,
            $anchoImagen,
            $altoImagen
        );

        $directorioQr =
            storage_path(
                'app/tickets/qr'
            );

        if (
            ! is_dir(
                $directorioQr
            )
        ) {
            mkdir(
                $directorioQr,
                0755,
                true
            );
        }

        $rutaQr =
            $directorioQr
            . DIRECTORY_SEPARATOR
            . 'ticket-'
            . $ticket->id
            . '.jpg';

        imagejpeg(
            $imagenJpeg,
            $rutaQr,
            100
        );

        imagedestroy(
            $imagenPng
        );

        imagedestroy(
            $imagenJpeg
        );

        if (
            ! file_exists(
                $rutaQr
            )
        ) {
            abort(
                500,
                'No fue posible guardar el código QR.'
            );
        }

        /*
         * 3. Configuración del ticket.
         *
         * 80 mm x 180 mm.
         */
        $anchoPagina =
            226.77;

        $altoPagina =
            510.24;

        $pdf =
            Pdf::loadView(
                'tickets.pdf',
                [
                    'ticket' =>
                        $ticket,
                ]
            )->setPaper([
                0,
                0,
                $anchoPagina,
                $altoPagina,
            ]);

        /*
         * 4. Renderizar primero todo
         * el contenido HTML.
         */
        $pdf->render();

        $dompdf =
            $pdf->getDomPDF();

        $canvas =
            $dompdf->getCanvas();

        /*
         * Para esta integración esperamos
         * el backend CPDF de DomPDF.
         */
        if (
            ! $canvas
                instanceof CPDF
        ) {
            abort(
                500,
                'El motor PDF actual no permite insertar el código QR.'
            );
        }

        /*
         * 5. Insertar JPEG directamente
         * en CPDF.
         */
        $tamanoQr =
            82.0;

        $xQr =
            (
                $anchoPagina
                - $tamanoQr
            ) / 2;

        $ySuperiorQr =
            211.0;

        /*
         * CPDF utiliza el origen vertical
         * desde la parte inferior.
         */
        $yInferiorQr =
            $altoPagina
            - $ySuperiorQr
            - $tamanoQr;

        $canvas
            ->get_cpdf()
            ->addJpegFromFile(
                $rutaQr,
                $xQr,
                $yInferiorQr,
                $tamanoQr,
                $tamanoQr
            );

        /*
         * 6. Obtener el PDF terminado.
         */
        $contenido =
            $pdf->output();

        $nombreArchivo =
            'ticket-'
            . $ticket->codigo
            . '.pdf';

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
                    . $nombreArchivo
                    . '"',

                'Cache-Control' =>
                    'private, no-store, max-age=0',
            ]
        );
    }

    /**
     * Valida el ingreso utilizando
     * el token del ticket.
     */
    public function validar(
        ValidarTicketRequest $request
    ): JsonResponse {
        Gate::authorize(
            'validar',
            Ticket::class
        );

        $ticket =
            DB::transaction(
                function () use (
                    $request
                ) {
                    $ticket =
                        Ticket::query()
                            ->with([
                                'entrada.venta.cliente',
                                'entrada.funcionAsiento.asiento',
                                'entrada.funcionAsiento.funcion.pelicula',
                                'entrada.funcionAsiento.funcion.sala',
                                'entrada.funcionAsiento.funcion.formato',
                            ])
                            ->where(
                                'token_validacion',
                                $request
                                    ->validated(
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

                    if (
                        $ticket->estado
                        !== 'ACTIVO'
                    ) {
                        throw ValidationException::withMessages([
                            'token_validacion' => [
                                'El ticket no se encuentra activo.',
                            ],
                        ]);
                    }

                    if (
                        ! $ticket->entrada
                    ) {
                        throw ValidationException::withMessages([
                            'token_validacion' => [
                                'El ticket no tiene una entrada asociada.',
                            ],
                        ]);
                    }

                    if (
                        $ticket
                            ->entrada
                            ->estado
                        !== 'VALIDA'
                    ) {
                        throw ValidationException::withMessages([
                            'token_validacion' => [
                                'La entrada asociada no se encuentra válida.',
                            ],
                        ]);
                    }

                    $fechaUtilizacion =
                        now();

                    $ticket->update([
                        'estado' =>
                            'UTILIZADO',

                        'utilizado_en' =>
                            $fechaUtilizacion,
                    ]);

                    $ticket
                        ->entrada
                        ->update([
                            'estado' =>
                                'UTILIZADA',

                            'utilizada_en' =>
                                $fechaUtilizacion,
                        ]);

                    return $ticket
                        ->fresh([
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

            'data' =>
                $ticket,
        ]);
    }
}