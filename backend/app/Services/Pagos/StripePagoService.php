<?php

namespace App\Services\Pagos;

use App\Contracts\ProveedorPagoInterface;
use App\Models\MetodoPago;
use App\Models\Pago;
use App\Models\Venta;
use RuntimeException;
use Stripe\StripeClient;

class StripePagoService implements ProveedorPagoInterface
{
    public function procesar(
        Pago $pago,
        Venta $venta,
        MetodoPago $metodoPago
    ): array {
        $claveSecreta =
            config('services.stripe.secret');

        if (
            ! is_string($claveSecreta)
            || $claveSecreta === ''
        ) {
            throw new RuntimeException(
                'La clave secreta de Stripe no se encuentra configurada.'
            );
        }

        $stripe = new StripeClient(
            $claveSecreta
        );

        $montoEnCentavos = (int) round(
            ((float) $venta->total) * 100
        );

        $paymentIntent =
            $stripe->paymentIntents->create(
                [
                    'amount' =>
                        $montoEnCentavos,

                    'currency' => 'gtq',

                    'automatic_payment_methods' => [
                        'enabled' => true,
                    ],

                    'description' => sprintf(
                        'Pago de la venta %s en Atlantic Cinema.',
                        $venta->numero_venta
                    ),

                    'metadata' => [
                        'pago_id' =>
                            (string) $pago->id,

                        'venta_id' =>
                            (string) $venta->id,

                        'numero_venta' =>
                            $venta->numero_venta,

                        'metodo_pago_id' =>
                            (string) $metodoPago->id,

                        'origen' =>
                            'ATLANTIC_CINEMA',
                    ],
                ],
                [
                    'idempotency_key' =>
                        sprintf(
                            'atlantic-cinema-pago-%s',
                            $pago->id
                        ),
                ]
            );

        return [
            'proveedor' => 'STRIPE',
            'referencia_proveedor' =>
                $paymentIntent->id,
            'estado' => 'PENDIENTE',
            'autorizacion_codigo' => null,
            'descripcion' => sprintf(
                'PaymentIntent de Stripe creado para el pago %s de la venta %s.',
                $pago->id,
                $venta->numero_venta
            ),
            'client_secret' =>
                $paymentIntent->client_secret,
        ];
    }
}