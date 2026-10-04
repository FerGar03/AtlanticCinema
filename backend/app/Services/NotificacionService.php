<?php

namespace App\Services;

use App\Models\Factura;
use App\Models\Notificacion;
use App\Models\Ticket;
use Barryvdh\DomPDF\Facade\Pdf;
use Dompdf\Adapter\CPDF;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class NotificacionService
{
    /**
     * Procesa una notificación pendiente
     * y realiza el envío real por correo.
     *
     * Cuando la notificación corresponde a
     * un ticket, adjunta:
     *
     * - Ticket electrónico PDF.
     * - Factura FEL PDF, cuando se encuentre
     *   certificada y disponible.
     */
    public function procesar(
        int $notificacionId
    ): Notificacion {
        $notificacion =
            Notificacion::query()
                ->with([
                    'usuario',
                    'venta.factura',
                    'reserva',
                    'factura',
                    'ticket.entrada.venta.cliente',
                    'ticket.entrada.funcionAsiento.asiento',
                    'ticket.entrada.funcionAsiento.funcion.pelicula',
                    'ticket.entrada.funcionAsiento.funcion.sala',
                    'ticket.entrada.funcionAsiento.funcion.formato',
                ])
                ->find(
                    $notificacionId
                );

        if (! $notificacion) {
            throw ValidationException::withMessages([
                'notificacion_id' => [
                    'La notificación indicada no existe.',
                ],
            ]);
        }

        if (
            ! in_array(
                $notificacion->estado,
                [
                    'PENDIENTE',
                    'ERROR',
                ],
                true
            )
        ) {
            throw ValidationException::withMessages([
                'notificacion_id' => [
                    'La notificación ya fue procesada.',
                ],
            ]);
        }

        if (
            blank(
                $notificacion->destinatario
            )
        ) {
            throw ValidationException::withMessages([
                'destinatario' => [
                    'La notificación no tiene un destinatario válido.',
                ],
            ]);
        }

        if (
            $notificacion->canal
            !== 'EMAIL'
        ) {
            throw ValidationException::withMessages([
                'canal' => [
                    'Actualmente solo se encuentra implementado el envío por correo electrónico.',
                ],
            ]);
        }

        try {
            $adjuntos = [];

            /*
             * Una notificación asociada a una venta
             * representa ahora un único correo de compra.
             *
             * Por lo tanto adjuntamos todos los tickets
             * válidos de esa venta en lugar de enviar
             * un correo separado por cada ticket.
             *
             * Las notificaciones históricas que solo
             * posean ticket_id continúan siendo
             * compatibles.
             */
            $tickets =
                $this
                    ->obtenerTicketsParaNotificacion(
                        $notificacion
                    );

            foreach ($tickets as $ticket) {
                $ticketPdf =
                    $this->generarTicketPdf(
                        $ticket
                    );

                $adjuntos[] = [
                    'contenido' =>
                        $ticketPdf['contenido'],

                    'nombre' =>
                        $ticketPdf['nombre'],

                    'mime' =>
                        'application/pdf',
                ];
            }

            /*
             * Buscamos la factura asociada.
             *
             * Puede venir directamente desde
             * factura_id o mediante la venta.
             */
            $factura =
                $notificacion->factura
                ?? $notificacion
                    ->venta
                    ?->factura;

            $facturaAdjunta = false;

            if (
                $factura
                && $factura->estado
                    === 'CERTIFICADA'
            ) {
                $facturaPdf =
                    $this->obtenerFacturaPdf(
                        $factura
                    );

                if ($facturaPdf !== null) {
                    $adjuntos[] = [
                        'contenido' =>
                            $facturaPdf,

                        'nombre' =>
                            $this
                                ->nombreFacturaPdf(
                                    $factura
                                ),

                        'mime' =>
                            'application/pdf',
                    ];

                    $facturaAdjunta = true;
                } else {
                    Log::warning(
                        'La factura está certificada, pero no posee un PDF válido para adjuntar al correo.',
                        [
                            'factura_id' =>
                                $factura->id,

                            'venta_id' =>
                                $notificacion
                                    ->venta_id,
                        ]
                    );
                }
            }

            $mensaje =
                trim(
                    (string)
                    $notificacion->mensaje
                );

            $cantidadTickets =
                $tickets->count();

            if ($cantidadTickets === 1) {
                $mensaje .=
                    "\n\nAdjuntamos tu ticket electrónico en formato PDF.";
            } elseif ($cantidadTickets > 1) {
                $mensaje .=
                    sprintf(
                        "\n\nAdjuntamos tus %d tickets electrónicos en formato PDF.",
                        $cantidadTickets
                    );
            }

            if ($facturaAdjunta) {
                $mensaje .=
                    "\nTambién encontrarás adjunta tu factura electrónica FEL.";
            }

            $mensaje .=
                "\n\nGracias por tu compra."
                . "\nAtlantic Cinema";

            Mail::raw(
                $mensaje,
                function (
                    $message
                ) use (
                    $notificacion,
                    $adjuntos
                ): void {
                    $message
                        ->to(
                            $notificacion
                                ->destinatario
                        )
                        ->subject(
                            $notificacion
                                ->asunto
                            ?: 'Atlantic Cinema'
                        );

                    foreach (
                        $adjuntos
                        as $adjunto
                    ) {
                        $message->attachData(
                            $adjunto['contenido'],
                            $adjunto['nombre'],
                            [
                                'mime' =>
                                    $adjunto['mime'],
                            ]
                        );
                    }
                }
            );

            $notificacion->update([
                'estado' =>
                    'ENVIADA',

                'enviada_en' =>
                    now(),
            ]);

            Log::info(
                'Correo electrónico enviado correctamente.',
                [
                    'notificacion_id' =>
                        $notificacion->id,

                    'destinatario' =>
                        $notificacion
                            ->destinatario,

                    'ticket_id' =>
                        $notificacion
                            ->ticket_id,

                    'factura_id' =>
                        $factura?->id,

                    'venta_id' =>
                        $notificacion
                            ->venta_id,

                    'cantidad_tickets' =>
                        $cantidadTickets,

                    'cantidad_adjuntos' =>
                        count(
                            $adjuntos
                        ),
                ]
            );
        } catch (\Throwable $exception) {
            $notificacion->update([
                'estado' =>
                    'ERROR',

                'enviada_en' =>
                    null,
            ]);

            Log::error(
                'No fue posible enviar el correo electrónico.',
                [
                    'notificacion_id' =>
                        $notificacion->id,

                    'destinatario' =>
                        $notificacion
                            ->destinatario,

                    'error' =>
                        $exception
                            ->getMessage(),
                ]
            );

            throw $exception;
        }

        return $notificacion->fresh([
            'usuario',
            'venta',
            'reserva',
            'factura',
            'ticket',
        ]);
    }

    /**
     * Obtiene los tickets que deben adjuntarse.
     *
     * Las nuevas notificaciones de compra se
     * asocian a la venta y adjuntan todos sus
     * tickets ACTIVO o UTILIZADO.
     *
     * Las notificaciones históricas asociadas
     * únicamente a un ticket siguen funcionando.
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, Ticket>
     */
    private function obtenerTicketsParaNotificacion(
        Notificacion $notificacion
    ): \Illuminate\Database\Eloquent\Collection {
        if ($notificacion->venta_id) {
            return Ticket::query()
                ->with([
                    'entrada.venta.cliente',
                    'entrada.funcionAsiento.asiento',
                    'entrada.funcionAsiento.funcion.pelicula',
                    'entrada.funcionAsiento.funcion.sala',
                    'entrada.funcionAsiento.funcion.formato',
                ])
                ->whereHas(
                    'entrada',
                    function (
                        $query
                    ) use (
                        $notificacion
                    ): void {
                        $query->where(
                            'venta_id',
                            $notificacion
                                ->venta_id
                        );
                    }
                )
                ->whereIn(
                    'estado',
                    [
                        'ACTIVO',
                        'UTILIZADO',
                    ]
                )
                ->orderBy('id')
                ->get();
        }

        if ($notificacion->ticket) {
            $ticket =
                $notificacion->ticket;

            $ticket->loadMissing([
                'entrada.venta.cliente',
                'entrada.funcionAsiento.asiento',
                'entrada.funcionAsiento.funcion.pelicula',
                'entrada.funcionAsiento.funcion.sala',
                'entrada.funcionAsiento.funcion.formato',
            ]);

            return new \Illuminate\Database\Eloquent\Collection([
                $ticket,
            ]);
        }

        return new \Illuminate\Database\Eloquent\Collection();
    }

    /**
     * Genera el PDF del ticket exactamente
     * con la misma estructura utilizada por
     * TicketController.
     *
     * @return array{
     *     contenido: string,
     *     nombre: string
     * }
     */
    private function generarTicketPdf(
        Ticket $ticket
    ): array {
        $ticket->loadMissing([
            'entrada.venta.cliente',
            'entrada.funcionAsiento.asiento',
            'entrada.funcionAsiento.funcion.pelicula',
            'entrada.funcionAsiento.funcion.sala',
            'entrada.funcionAsiento.funcion.formato',
        ]);

        if (! $ticket->entrada) {
            throw new RuntimeException(
                'El ticket no posee una entrada asociada.'
            );
        }

        if (
            ! $ticket
                ->entrada
                ->funcionAsiento
        ) {
            throw new RuntimeException(
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
            throw new RuntimeException(
                'El ticket no posee un token de validación.'
            );
        }

        /*
         * Generar el QR.
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
         * Convertimos el QR PNG a JPEG
         * para insertarlo directamente
         * mediante CPDF.
         */
        $imagenPng =
            imagecreatefromstring(
                $resultadoQr
                    ->getString()
            );

        if ($imagenPng === false) {
            throw new RuntimeException(
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

        if ($imagenJpeg === false) {
            imagedestroy(
                $imagenPng
            );

            throw new RuntimeException(
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
            throw new RuntimeException(
                'No fue posible guardar el código QR.'
            );
        }

        /*
         * Ticket de 80 mm x 180 mm.
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

        $pdf->render();

        $dompdf =
            $pdf->getDomPDF();

        $canvas =
            $dompdf->getCanvas();

        if (
            ! $canvas
                instanceof CPDF
        ) {
            throw new RuntimeException(
                'El motor PDF actual no permite insertar el código QR.'
            );
        }

        $tamanoQr =
            82.0;

        $xQr =
            (
                $anchoPagina
                - $tamanoQr
            ) / 2;

        $ySuperiorQr =
            211.0;

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

        $contenido =
            $pdf->output();

        return [
            'contenido' =>
                $contenido,

            'nombre' =>
                'ticket-'
                . $ticket->codigo
                . '.pdf',
        ];
    }

    /**
     * Obtiene el PDF certificado almacenado
     * por el proveedor FEL.
     */
    private function obtenerFacturaPdf(
        Factura $factura
    ): ?string {
        $datos =
            $factura
                ->datos_proveedor;

        if (is_string($datos)) {
            $datos =
                json_decode(
                    $datos,
                    true
                );
        }

        if (! is_array($datos)) {
            return null;
        }

        $base64 =
            $datos[
                'pdf_base64'
            ] ?? null;

        if (
            ! is_string($base64)
            || trim($base64) === ''
        ) {
            return null;
        }

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

        if ($contenido === false) {
            return null;
        }

        return $contenido;
    }

    /**
     * Genera el mismo esquema de nombre
     * utilizado para descargar la factura.
     */
    private function nombreFacturaPdf(
        Factura $factura
    ): string {
        $identificador =
            $factura->serie
            && $factura
                ->numero_documento
                ? $factura->serie
                    . '-'
                    . $factura
                        ->numero_documento
                : $factura
                    ->numero_interno;

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
            . '.pdf';
    }
}
