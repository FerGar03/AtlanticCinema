<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pago;
use App\Services\FacturaService;
use App\Services\NotificacionService;
use App\Services\PagoService;
use App\Services\TicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Svix\Webhook;

class RecurrenteWebhookController extends Controller
{
    public function __construct(
        private readonly PagoService $pagoService,
        private readonly FacturaService $facturaService,
        private readonly TicketService $ticketService,
        private readonly NotificacionService $notificacionService
    ) {
    }

    public function handle(
        Request $request
    ): JsonResponse {
        $secret = config(
            'services.recurrente.webhook_secret'
        );

        if (
            ! is_string($secret)
            || trim($secret) === ''
        ) {
            Log::error(
                'Webhook de Recurrente sin secret configurado.'
            );

            return response()->json([
                'message' =>
                    'Webhook no configurado.',
            ], 500);
        }

        /*
         * PRIMERA FASE:
         *
         * Guardamos exactamente el cuerpo recibido.
         *
         * Es importante no reconstruir el JSON
         * antes de verificar la firma.
         */
        $rawBody =
            $request->getContent();

        $svixId =
            $request->header(
                'svix-id'
            );

        $svixTimestamp =
            $request->header(
                'svix-timestamp'
            );

        $svixSignature =
            $request->header(
                'svix-signature'
            );

        if (
            ! is_string($svixId)
            || ! is_string($svixTimestamp)
            || ! is_string($svixSignature)
        ) {
            Log::warning(
                'Webhook de Recurrente sin encabezados Svix completos.'
            );

            return response()->json([
                'message' =>
                    'Faltan los encabezados de verificación del webhook.',
            ], 400);
        }

        $headers = [
            'svix-id' =>
                $svixId,

            'svix-timestamp' =>
                $svixTimestamp,

            'svix-signature' =>
                $svixSignature,
        ];

        /*
         * Verificamos autenticidad del webhook.
         *
         * No utilizamos el valor devuelto por
         * verify(). Solamente nos interesa que
         * la firma sea válida.
         */
        try {
            $webhook =
                new Webhook(
                    $secret
                );

            $webhook->verify(
                $rawBody,
                $headers
            );
        } catch (\Throwable $exception) {
            Log::warning(
                'Firma inválida de webhook Recurrente.',
                [
                    'error' =>
                        $exception
                            ->getMessage(),

                    'svix_id' =>
                        $svixId,
                ]
            );

            return response()->json([
                'message' =>
                    'Firma de webhook inválida.',
            ], 400);
        }

        /*
         * SEGUNDA FASE:
         *
         * Una vez comprobada la firma,
         * interpretamos nosotros mismos el
         * mismo body crudo como JSON.
         */
        $payload =
            json_decode(
                $rawBody,
                true
            );

        if (! is_array($payload)) {
            Log::error(
                'El webhook de Recurrente contiene JSON inválido.',
                [
                    'svix_id' =>
                        $svixId,

                    'json_error' =>
                        json_last_error_msg(),
                ]
            );

            return response()->json([
                'message' =>
                    'Payload de webhook inválido.',
            ], 400);
        }

        /*
         * TERCERA FASE:
         *
         * PagoService procesa únicamente:
         *
         * - intent.succeeded
         * - intent.failed
         * - intent.canceled
         *
         * Los demás eventos son ignorados.
         */
        try {
            $this
                ->pagoService
                ->procesarWebhookRecurrente(
                    $payload
                );
        } catch (\Throwable $exception) {
            Log::error(
                'Error procesando webhook de Recurrente.',
                [
                    'error' =>
                        $exception
                            ->getMessage(),

                    'svix_id' =>
                        $svixId,

                    'event_type' =>
                        $payload[
                            'event_type'
                        ] ?? null,

                    'checkout_id' =>
                        $payload[
                            'checkout'
                        ][
                            'id'
                        ] ?? null,
                ]
            );

            return response()->json([
                'message' =>
                    'No fue posible procesar el webhook.',
            ], 500);
        }

        /*
         * CUARTA FASE:
         *
         * Si el pago fue confirmado,
         * intentamos generar la factura FEL.
         *
         * Un error FEL nunca debe revertir
         * un pago ya aprobado.
         */
        $this->intentarFacturacionAutomatica(
            $payload
        );

        /*
         * QUINTA FASE:
         *
         * Después de una compra confirmada
         * generamos un ticket electrónico por
         * cada entrada.
         *
         * TicketService evita duplicados:
         * si ya existe un ticket ACTIVO para
         * la entrada, lo reutiliza.
         *
         * Después intentamos enviar por correo
         * las notificaciones pendientes asociadas
         * a los tickets.
         *
         * Un error de tickets o correo tampoco
         * debe revertir el pago.
         */
        $this->intentarGeneracionAutomaticaTickets(
            $payload
        );

        Log::info(
            'Webhook de Recurrente procesado correctamente.',
            [
                'svix_id' =>
                    $svixId,

                'event_type' =>
                    $payload[
                        'event_type'
                    ] ?? null,

                'intent_id' =>
                    $payload[
                        'id'
                    ] ?? null,

                'checkout_id' =>
                    $payload[
                        'checkout'
                    ][
                        'id'
                    ] ?? null,
            ]
        );

        return response()->json([
            'message' =>
                'Webhook procesado correctamente.',
        ]);
    }

    /**
     * Genera automáticamente la factura FEL
     * después de que Recurrente confirme
     * correctamente el pago.
     *
     * Los errores de facturación no afectan
     * el pago previamente confirmado.
     *
     * @param array<string, mixed> $payload
     */
    private function intentarFacturacionAutomatica(
        array $payload
    ): void {
        /*
         * Únicamente el evento moderno de
         * pago exitoso genera factura.
         */
        if (
            ($payload['event_type'] ?? null)
            !== 'intent.succeeded'
        ) {
            return;
        }

        if (
            ($payload['type'] ?? null)
            !== 'payment'
        ) {
            return;
        }

        $checkoutId =
            $payload[
                'checkout'
            ][
                'id'
            ] ?? null;

        if (
            ! is_string($checkoutId)
            || trim($checkoutId) === ''
        ) {
            Log::warning(
                'No se pudo iniciar la facturación automática: el webhook no contiene checkout_id.'
            );

            return;
        }

        try {
            $pago =
                Pago::query()
                    ->with([
                        'venta.factura',
                    ])
                    ->where(
                        'proveedor',
                        'RECURRENTE'
                    )
                    ->where(
                        'referencia_proveedor',
                        $checkoutId
                    )
                    ->first();

            if (! $pago) {
                Log::warning(
                    'No se pudo iniciar la facturación automática: no se encontró el pago.',
                    [
                        'checkout_id' =>
                            $checkoutId,
                    ]
                );

                return;
            }

            /*
             * PagoService debe haber aprobado
             * previamente el pago.
             */
            if (
                $pago->estado
                !== 'APROBADO'
            ) {
                return;
            }

            $venta =
                $pago->venta;

            if (! $venta) {
                Log::warning(
                    'No se pudo iniciar la facturación automática: el pago no posee venta asociada.',
                    [
                        'pago_id' =>
                            $pago->id,
                    ]
                );

                return;
            }

            if (
                $venta->estado
                !== 'PAGADA'
            ) {
                return;
            }

            /*
             * Idempotencia:
             *
             * si Recurrente reenvía el webhook,
             * no creamos una segunda factura.
             *
             * Una factura ERROR tampoco se
             * sustituye automáticamente.
             */
            if (
                $venta->factura
                !== null
            ) {
                return;
            }

            $nitReceptor =
                strtoupper(
                    trim(
                        (string) (
                            $venta
                                ->nit_facturacion
                            ?: 'CF'
                        )
                    )
                );

            if ($nitReceptor === '') {
                $nitReceptor =
                    'CF';
            }

            $nombreReceptor =
                trim(
                    (string) (
                        $venta
                            ->nombre_facturacion
                        ?: ''
                    )
                );

            if ($nombreReceptor === '') {
                $nombreReceptor =
                    $nitReceptor === 'CF'
                        ? 'Consumidor Final'
                        : '';
            }

            if ($nombreReceptor === '') {
                Log::error(
                    'No se pudo generar automáticamente la factura: la venta no posee nombre fiscal.',
                    [
                        'venta_id' =>
                            $venta->id,

                        'nit_facturacion' =>
                            $nitReceptor,
                    ]
                );

                return;
            }

            $factura =
                $this
                    ->facturaService
                    ->generar(
                        $venta->id,
                        [
                            'nit_receptor' =>
                                $nitReceptor,

                            'nombre_receptor' =>
                                $nombreReceptor,
                        ]
                    );

            Log::info(
                'Factura FEL generada automáticamente después de pago Recurrente.',
                [
                    'venta_id' =>
                        $venta->id,

                    'pago_id' =>
                        $pago->id,

                    'factura_id' =>
                        $factura->id,

                    'estado_factura' =>
                        $factura->estado,

                    'serie' =>
                        $factura->serie,

                    'numero_documento' =>
                        $factura
                            ->numero_documento,

                    'uuid' =>
                        $factura->uuid,
                ]
            );
        } catch (\Throwable $exception) {
            /*
             * Recurrente ya confirmó la compra.
             *
             * Por lo tanto el error FEL no se
             * propaga hacia el webhook.
             */
            Log::error(
                'La compra fue pagada, pero no fue posible completar la facturación FEL automática.',
                [
                    'checkout_id' =>
                        $checkoutId,

                    'error' =>
                        $exception
                            ->getMessage(),
                ]
            );
        }
    }

    /**
     * Genera automáticamente un ticket
     * electrónico por cada entrada de una
     * venta confirmada por Recurrente.
     *
     * Después intenta enviar por correo
     * las notificaciones pendientes asociadas.
     *
     * Un error de tickets o correo nunca debe
     * revertir el pago ni la factura.
     *
     * @param array<string, mixed> $payload
     */
    private function intentarGeneracionAutomaticaTickets(
        array $payload
    ): void {
        /*
         * Igual que la factura, solamente
         * actuamos ante el evento moderno
         * de pago exitoso.
         */
        if (
            ($payload['event_type'] ?? null)
            !== 'intent.succeeded'
        ) {
            return;
        }

        if (
            ($payload['type'] ?? null)
            !== 'payment'
        ) {
            return;
        }

        $checkoutId =
            $payload[
                'checkout'
            ][
                'id'
            ] ?? null;

        if (
            ! is_string($checkoutId)
            || trim($checkoutId) === ''
        ) {
            Log::warning(
                'No se pudo iniciar la generación automática de tickets: el webhook no contiene checkout_id.'
            );

            return;
        }

        try {
            $pago =
                Pago::query()
                    ->with([
                        'venta.entradas',
                    ])
                    ->where(
                        'proveedor',
                        'RECURRENTE'
                    )
                    ->where(
                        'referencia_proveedor',
                        $checkoutId
                    )
                    ->first();

            if (! $pago) {
                Log::warning(
                    'No se pudo iniciar la generación automática de tickets: no se encontró el pago.',
                    [
                        'checkout_id' =>
                            $checkoutId,
                    ]
                );

                return;
            }

            if (
                $pago->estado
                !== 'APROBADO'
            ) {
                return;
            }

            $venta =
                $pago->venta;

            if (! $venta) {
                Log::warning(
                    'No se pudo iniciar la generación automática de tickets: el pago no posee venta asociada.',
                    [
                        'pago_id' =>
                            $pago->id,
                    ]
                );

                return;
            }

            if (
                $venta->estado
                !== 'PAGADA'
            ) {
                return;
            }

            /*
             * TicketService realiza internamente
             * la comprobación de tickets ACTIVO
             * existentes, por lo que esta llamada
             * es segura ante reintentos de Svix.
             */
            $tickets =
                $this
                    ->ticketService
                    ->generarParaVenta(
                        $venta->id
                    );

            /*
             * Procesamos las notificaciones EMAIL
             * pendientes o con error asociadas
             * a los tickets generados.
             */
            foreach ($tickets as $ticket) {
                $notificacion =
                    $ticket
                        ->notificaciones()
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
                        ->latest(
                            'id'
                        )
                        ->first();

                if (! $notificacion) {
                    continue;
                }

                try {
                    $this
                        ->notificacionService
                        ->procesar(
                            $notificacion->id
                        );
                } catch (\Throwable $exception) {
                    /*
                     * El ticket ya fue generado.
                     *
                     * Un fallo de correo no debe
                     * revertir pago, venta, factura
                     * ni ticket.
                     */
                    Log::error(
                        'El ticket fue generado, pero no fue posible enviar el correo electrónico.',
                        [
                            'venta_id' =>
                                $venta->id,

                            'ticket_id' =>
                                $ticket->id,

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
                }
            }

            Log::info(
                'Tickets electrónicos generados automáticamente después de pago Recurrente.',
                [
                    'venta_id' =>
                        $venta->id,

                    'pago_id' =>
                        $pago->id,

                    'cantidad_tickets' =>
                        $tickets->count(),

                    'tickets' =>
                        $tickets
                            ->pluck('codigo')
                            ->values()
                            ->all(),
                ]
            );
        } catch (\Throwable $exception) {
            /*
             * La compra ya fue pagada.
             *
             * El fallo al generar los tickets
             * se registra, pero nunca se revierte
             * la venta ni el pago.
             */
            Log::error(
                'La compra fue pagada, pero no fue posible completar la generación automática de tickets.',
                [
                    'checkout_id' =>
                        $checkoutId,

                    'error' =>
                        $exception
                            ->getMessage(),
                ]
            );
        }
    }
}