<?php

namespace App\Services\Pagos;

use App\Contracts\ProveedorPagoInterface;
use App\Models\MetodoPago;
use App\Models\Pago;
use App\Models\Venta;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class RecurrentePagoService implements ProveedorPagoInterface
{
    /**
     * Crea un checkout alojado en Recurrente.
     *
     * El pago permanece PENDIENTE hasta que
     * Recurrente confirme el resultado mediante
     * el webhook firmado.
     */
    public function procesar(
        Pago $pago,
        Venta $venta,
        MetodoPago $metodoPago
    ): array {
        $secretKey = config(
            'services.recurrente.secret_key'
        );

        $apiUrl = rtrim(
            (string) config(
                'services.recurrente.api_url'
            ),
            '/'
        );

        $successUrl = config(
            'services.recurrente.success_url'
        );

        $cancelUrl = config(
            'services.recurrente.cancel_url'
        );

        if (
            ! is_string($secretKey)
            || trim($secretKey) === ''
        ) {
            throw new RuntimeException(
                'La llave secreta de Recurrente no está configurada.'
            );
        }

        if ($apiUrl === '') {
            throw new RuntimeException(
                'La URL de la API de Recurrente no está configurada.'
            );
        }

        if (
            ! is_string($successUrl)
            || trim($successUrl) === ''
        ) {
            throw new RuntimeException(
                'La URL de éxito de Recurrente no está configurada.'
            );
        }

        if (
            ! is_string($cancelUrl)
            || trim($cancelUrl) === ''
        ) {
            throw new RuntimeException(
                'La URL de cancelación de Recurrente no está configurada.'
            );
        }

        /*
         * Recurrente trabaja con centavos.
         *
         * Q35.00 -> 3500
         */
        $montoEnCentavos =
            (int) round(
                (float) $venta->total
                * 100
            );

        if ($montoEnCentavos <= 0) {
            throw new RuntimeException(
                'El monto de la venta no es válido para crear el checkout.'
            );
        }

        /*
         * Checkout con producto inline.
         *
         * No utilizamos un product_id fijo porque cada Sandbox
         * de Recurrente administra sus propios productos e IDs.
         *
         * De esta forma Atlantic Cinema puede enviar directamente
         * el total real calculado para cada venta.
         */
        $payload = [
            'items' => [
                [
                    'name' =>
                        'Entradas Atlantic Cinema - '
                        . $venta->numero_venta,

                    'amount_in_cents' =>
                        $montoEnCentavos,

                    'currency' =>
                        'GTQ',

                    'quantity' =>
                        1,

                    /*
                     * Atlantic Cinema utilizará únicamente
                     * pago con tarjeta.
                     */
                    'payment_method_types' => [
                        'card',
                    ],

                    /*
                     * No se ofrecerán pagos en cuotas.
                     */
                    'available_installments' => [],

                    /*
                     * Los datos fiscales se solicitan previamente
                     * dentro de Atlantic Cinema y posteriormente
                     * se utilizan para generar el FEL con Digifact.
                     *
                     * Por lo tanto, Recurrente no debe solicitar
                     * nuevamente información de facturación.
                     */
                    'billing_info_requirement' =>
                        'none',

                    'phone_requirement' =>
                        'none',

                    'address_requirement' =>
                        'none',
                ],
            ],

            'success_url' =>
                $successUrl,

            'cancel_url' =>
                $cancelUrl,

            /*
             * Esta metadata permite relacionar
             * el checkout con los registros
             * internos de Atlantic Cinema.
             */
            'metadata' => [
                'pago_id' =>
                    (string) $pago->id,

                'venta_id' =>
                    (string) $venta->id,

                'numero_venta' =>
                    (string) $venta->numero_venta,

                'origen' =>
                    (string) $venta->origen,

                'origen_sistema' =>
                    'ATLANTIC_CINEMA',
            ],
        ];

        try {
            $response =
                Http::acceptJson()
                    ->asJson()
                    ->withHeaders([
                        'X-SECRET-KEY' =>
                            $secretKey,
                    ])
                    ->timeout(20)
                    ->post(
                        $apiUrl
                        . '/checkouts',
                        $payload
                    );

            /*
             * No utilizamos retry() aquí.
             *
             * Repetir automáticamente un POST
             * podría crear más de un checkout si
             * el proveedor alcanzó a procesar la
             * primera solicitud.
             */
            $response->throw();
        } catch (
            ConnectionException
            | RequestException
            $exception
        ) {
            throw new RuntimeException(
                'No fue posible crear el checkout en Recurrente: '
                . $exception->getMessage(),
                previous:
                    $exception
            );
        }

        $checkout =
            $response->json();

        $checkoutId =
            $checkout['id']
            ?? null;

        $checkoutUrl =
            $checkout['checkout_url']
            ?? null;

        if (
            ! is_string($checkoutId)
            || trim($checkoutId) === ''
        ) {
            throw new RuntimeException(
                'Recurrente no devolvió el identificador del checkout.'
            );
        }

        if (
            ! is_string($checkoutUrl)
            || trim($checkoutUrl) === ''
        ) {
            throw new RuntimeException(
                'Recurrente no devolvió la URL del checkout.'
            );
        }

        return [
            'proveedor' =>
                'RECURRENTE',

            /*
             * Guardamos ch_... como referencia.
             *
             * Esto es importante porque el webhook
             * también contiene checkout.id.
             */
            'referencia_proveedor' =>
                $checkoutId,

            /*
             * Crear el checkout NO significa
             * que el pago esté aprobado.
             *
             * El webhook de Recurrente continúa
             * siendo la única fuente de verdad.
             */
            'estado' =>
                'PENDIENTE',

            'autorizacion_codigo' =>
                null,

            'descripcion' =>
                'Checkout creado correctamente en Recurrente.',

            /*
             * Conservamos el nombre histórico
             * client_secret para no romper el
             * contrato actual del frontend.
             *
             * En Recurrente este valor realmente
             * es la URL alojada del checkout.
             */
            'client_secret' =>
                $checkoutUrl,
        ];
    }
}