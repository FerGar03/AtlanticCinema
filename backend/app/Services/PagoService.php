<?php

namespace App\Services;

use App\Contracts\ProveedorPagoInterface;
use App\Models\FuncionAsiento;
use App\Models\MetodoPago;
use App\Models\Pago;
use App\Models\Venta;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PagoService
{
    public function __construct(
        private readonly ProveedorPagoInterface $proveedorPago
    ) {
    }

    /**
     * Flujo general de pagos.
     *
     * Se conserva para:
     * - efectivo existente;
     * - compra web;
     * - proveedores externos;
     * - Recurrente.
     */
    public function registrar(
        array $datos
    ): Pago {
        $contexto =
            DB::transaction(
                function () use (
                    $datos
                ) {
                    $venta =
                        Venta::query()
                            ->with(
                                'entradas'
                            )
                            ->lockForUpdate()
                            ->findOrFail(
                                $datos[
                                    'venta_id'
                                ]
                            );

                    $metodoPago =
                        MetodoPago::query()
                            ->whereKey(
                                $datos[
                                    'metodo_pago_id'
                                ]
                            )
                            ->where(
                                'estado',
                                'ACTIVO'
                            )
                            ->first();

                    if (
                        ! $metodoPago
                    ) {
                        throw ValidationException::withMessages([
                            'metodo_pago_id' =>
                                'El método de pago no existe o está inactivo.',
                        ]);
                    }

                    $this->validarVenta(
                        $venta
                    );

                    $this
                        ->validarVigenciaVentaBloqueada(
                            $venta
                        );

                    $this
                        ->validarPagoAprobadoExistente(
                            $venta
                        );

                    if (
                        $metodoPago->codigo
                        === 'EFECTIVO'
                    ) {
                        $pago =
                            $this
                                ->registrarPagoEfectivo(
                                    $venta,
                                    $metodoPago,
                                    $datos
                                );

                        $this
                            ->marcarVentaComoPagada(
                                $venta
                            );

                        return [
                            'tipo' =>
                                'EFECTIVO',

                            'pago' =>
                                $pago,

                            'venta' =>
                                $venta,

                            'metodo_pago' =>
                                $metodoPago,
                        ];
                    }

                    $pago =
                        Pago::query()
                            ->create([
                                'venta_id' =>
                                    $venta->id,

                                'metodo_pago_id' =>
                                    $metodoPago->id,

                                'proveedor' =>
                                    'PENDIENTE',

                                'referencia_proveedor' =>
                                    null,

                                'monto' =>
                                    $venta->total,

                                'moneda' =>
                                    'GTQ',

                                'estado' =>
                                    'PENDIENTE',

                                'autorizacion_codigo' =>
                                    null,

                                'aprobado_en' =>
                                    null,

                                'descripcion' =>
                                    $datos[
                                        'descripcion'
                                    ] ?? null,
                            ]);

                    return [
                        'tipo' =>
                            'EXTERNO',

                        'pago' =>
                            $pago,

                        'venta' =>
                            $venta,

                        'metodo_pago' =>
                            $metodoPago,
                    ];
                }
            );

        if (
            $contexto['tipo']
            === 'EFECTIVO'
        ) {
            return $contexto[
                'pago'
            ]->load([
                'venta.entradas',
                'metodoPago',
            ]);
        }

        return $this
            ->procesarPagoExterno(
                $contexto['pago'],
                $contexto['venta'],
                $contexto[
                    'metodo_pago'
                ]
            );
    }

    /**
     * Registra pagos realizados físicamente
     * en la taquilla del cine.
     *
     * EFECTIVO:
     * se verifica el efectivo recibido.
     *
     * TARJETA:
     * el cobro ya debe haber sido aprobado
     * previamente por el POS físico.
     */
    public function registrarTaquilla(
        array $datos
    ): Pago {
        return DB::transaction(
            function () use (
                $datos
            ): Pago {
                $venta =
                    Venta::query()
                        ->with(
                            'entradas'
                        )
                        ->lockForUpdate()
                        ->findOrFail(
                            $datos[
                                'venta_id'
                            ]
                        );

                /*
                 * Solo operaciones realmente
                 * atendidas en taquilla.
                 *
                 * RESERVA también se admite porque
                 * una reserva puede convertirse en
                 * venta y cobrarse presencialmente.
                 */
                if (
                    ! in_array(
                        $venta->origen,
                        [
                            'TAQUILLA',
                            'RESERVA',
                        ],
                        true
                    )
                ) {
                    throw ValidationException::withMessages([
                        'venta_id' =>
                            'Esta venta no corresponde a un cobro presencial de taquilla.',
                    ]);
                }

                $this->validarVenta(
                    $venta
                );

                $this
                    ->validarVigenciaVentaBloqueada(
                        $venta
                    );

                $this
                    ->validarPagoAprobadoExistente(
                        $venta
                    );

                $metodoPago =
                    MetodoPago::query()
                        ->where(
                            'codigo',
                            $datos[
                                'metodo'
                            ]
                        )
                        ->where(
                            'estado',
                            'ACTIVO'
                        )
                        ->first();

                if (
                    ! $metodoPago
                ) {
                    throw ValidationException::withMessages([
                        'metodo' =>
                            'El método de pago no existe o está inactivo.',
                    ]);
                }

                if (
                    $metodoPago->codigo
                    === 'EFECTIVO'
                ) {
                    $pago =
                        $this
                            ->registrarEfectivoTaquilla(
                                $venta,
                                $metodoPago,
                                $datos
                            );
                } else {
                    $pago =
                        $this
                            ->registrarTarjetaPos(
                                $venta,
                                $metodoPago,
                                $datos
                            );
                }

                $this
                    ->marcarVentaComoPagada(
                        $venta
                    );

                return $pago->load([
                    'venta.entradas.funcionAsiento.asiento',
                    'venta.funcion.pelicula',
                    'venta.funcion.sala',
                    'venta.funcion.formato',
                    'metodoPago',
                ]);
            },
            3
        );
    }

    public function confirmarSimulado(
        Pago $pago,
        string $resultado
    ): Pago {
        return DB::transaction(
            function () use (
                $pago,
                $resultado
            ) {
                $pagoBloqueado =
                    Pago::query()
                        ->lockForUpdate()
                        ->findOrFail(
                            $pago->id
                        );

                $venta =
                    Venta::query()
                        ->with(
                            'entradas'
                        )
                        ->lockForUpdate()
                        ->findOrFail(
                            $pagoBloqueado
                                ->venta_id
                        );

                $this
                    ->validarVigenciaVentaBloqueada(
                        $venta
                    );

                if (
                    $pagoBloqueado
                        ->proveedor
                    !== 'SIMULADOR'
                ) {
                    throw ValidationException::withMessages([
                        'pago' =>
                            'El pago no pertenece al proveedor simulado.',
                    ]);
                }

                if (
                    $pagoBloqueado
                        ->estado
                    !== 'PENDIENTE'
                ) {
                    throw ValidationException::withMessages([
                        'pago' =>
                            'El pago ya fue procesado anteriormente.',
                    ]);
                }

                $estado =
                    $resultado
                    === 'APROBADO'
                        ? 'APROBADO'
                        : 'RECHAZADO';

                $pagoBloqueado
                    ->update([
                        'estado' =>
                            $estado,

                        'autorizacion_codigo' =>
                            $estado
                            === 'APROBADO'
                                ? 'SIM-AUTH-'
                                    . strtoupper(
                                        bin2hex(
                                            random_bytes(
                                                6
                                            )
                                        )
                                    )
                                : null,

                        'aprobado_en' =>
                            $estado
                            === 'APROBADO'
                                ? now()
                                : null,

                        'descripcion' =>
                            $estado
                            === 'APROBADO'
                                ? 'Pago aprobado por el simulador.'
                                : 'Pago rechazado por el simulador.',
                    ]);

                if (
                    $estado
                    === 'APROBADO'
                ) {
                    $this
                        ->marcarVentaComoPagada(
                            $venta
                        );
                } elseif (
                    $venta->origen
                    === 'COMPRA_WEB'
                ) {
                    $this
                        ->marcarCompraWebComoFallida(
                            $venta
                        );
                }

                return $pagoBloqueado
                    ->load([
                        'venta.entradas',
                        'metodoPago',
                    ]);
            },
            3
        );
    }

    public function procesarWebhookRecurrente(
    array $payload
): void {
    $eventType =
        $payload[
            'event_type'
        ] ?? null;

    /*
     * Solo trabajamos con el formato
     * unificado moderno intent.*.
     *
     * Esto también evita procesar dos veces
     * el mismo cobro si Recurrente entrega
     * simultáneamente eventos legacy.
     */
    if (
        ! in_array(
            $eventType,
            [
                'intent.succeeded',
                'intent.failed',
                'intent.canceled',
            ],
            true
        )
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
        throw ValidationException::withMessages([
            'webhook' =>
                'El webhook de Recurrente no contiene el checkout asociado.',
        ]);
    }

    $metadata =
        $payload[
            'checkout'
        ][
            'metadata'
        ] ?? [];

    DB::transaction(
        function () use (
            $payload,
            $eventType,
            $checkoutId,
            $metadata
        ) {
            /*
             * La referencia ch_... es nuestra
             * llave principal para encontrar
             * el intento de pago.
             */
            $pago =
                Pago::query()
                    ->where(
                        'proveedor',
                        'RECURRENTE'
                    )
                    ->where(
                        'referencia_proveedor',
                        $checkoutId
                    )
                    ->lockForUpdate()
                    ->first();

            /*
             * Compatibilidad de respaldo:
             * si el checkout fue creado por una
             * versión anterior del servicio,
             * intentamos recuperarlo mediante
             * metadata.pago_id.
             */
            if (
                ! $pago
                && isset(
                    $metadata[
                        'pago_id'
                    ]
                )
            ) {
                $pago =
                    Pago::query()
                        ->whereKey(
                            (int)
                            $metadata[
                                'pago_id'
                            ]
                        )
                        ->where(
                            'proveedor',
                            'RECURRENTE'
                        )
                        ->lockForUpdate()
                        ->first();
            }

            if (! $pago) {
                throw ValidationException::withMessages([
                    'webhook' =>
                        'No se encontró el pago asociado al checkout de Recurrente.',
                ]);
            }

            $venta =
                Venta::query()
                    ->with(
                        'entradas'
                    )
                    ->lockForUpdate()
                    ->findOrFail(
                        $pago->venta_id
                    );

            /*
             * Si Recurrente devolvió metadata,
             * también comprobamos que coincida
             * con nuestros registros.
             */
            if (
                isset(
                    $metadata[
                        'pago_id'
                    ]
                )
                && (int)
                    $metadata[
                        'pago_id'
                    ]
                    !== $pago->id
            ) {
                throw ValidationException::withMessages([
                    'webhook' =>
                        'El identificador de pago de la metadata no coincide.',
                ]);
            }

            if (
                isset(
                    $metadata[
                        'venta_id'
                    ]
                )
                && (int)
                    $metadata[
                        'venta_id'
                    ]
                    !== $venta->id
            ) {
                throw ValidationException::withMessages([
                    'webhook' =>
                        'El identificador de venta de la metadata no coincide.',
                ]);
            }

            /*
             * Idempotencia.
             *
             * Recurrente/Svix puede reenviar
             * exactamente el mismo webhook.
             */
            if (
                $pago->estado
                !== 'PENDIENTE'
            ) {
                return;
            }

            $montoCentavos =
                (int) (
                    $payload[
                        'amount_in_cents'
                    ] ?? 0
                );

            $montoWebhook =
                $montoCentavos
                / 100;

            if (
                $montoCentavos
                <= 0
                || round(
                    (float)
                    $pago->monto,
                    2
                )
                !== round(
                    $montoWebhook,
                    2
                )
            ) {
                throw ValidationException::withMessages([
                    'webhook' =>
                        'El monto recibido desde Recurrente no coincide con el pago.',
                ]);
            }

            if (
                strtoupper(
                    (string) (
                        $payload[
                            'currency'
                        ] ?? ''
                    )
                )
                !== strtoupper(
                    (string)
                    $pago->moneda
                )
            ) {
                throw ValidationException::withMessages([
                    'webhook' =>
                        'La moneda recibida desde Recurrente no coincide con el pago.',
                ]);
            }

            if (
                $eventType
                === 'intent.succeeded'
            ) {
                $pago->update([
                    'estado' =>
                        'APROBADO',

                    'autorizacion_codigo' =>
                        isset(
                            $payload[
                                'receipt_number'
                            ]
                        )
                            ? (string)
                                $payload[
                                    'receipt_number'
                                ]
                            : (
                                isset(
                                    $payload[
                                        'id'
                                    ]
                                )
                                    ? (string)
                                        $payload[
                                            'id'
                                        ]
                                    : null
                            ),

                    'aprobado_en' =>
                        now(),

                    'descripcion' =>
                        'Pago aprobado por Recurrente.',
                ]);

                $this
                    ->marcarVentaComoPagada(
                        $venta
                    );

                return;
            }

            $motivo =
                $payload[
                    'details'
                ][
                    'failure_reason'
                ]
                ?? (
                    $eventType
                    === 'intent.canceled'
                        ? 'Pago cancelado en Recurrente.'
                        : 'Pago rechazado por Recurrente.'
                );

            $pago->update([
                'estado' =>
                    'RECHAZADO',

                'autorizacion_codigo' =>
                    null,

                'aprobado_en' =>
                    null,

                'descripcion' =>
                    $motivo,
            ]);

            /*
             * En una compra web fallida liberamos
             * inmediatamente los asientos para no
             * mantener inventario bloqueado.
             */
            if (
                $venta->origen
                === 'COMPRA_WEB'
                && $venta->estado
                === 'PENDIENTE'
            ) {
                $this
                    ->marcarCompraWebComoFallida(
                        $venta
                    );
            }
        },
        3
    );
}

    private function procesarPagoExterno(
        Pago $pago,
        Venta $venta,
        MetodoPago $metodoPago
    ): Pago {
        try {
            $respuesta =
                $this
                    ->proveedorPago
                    ->procesar(
                        $pago,
                        $venta,
                        $metodoPago
                    );

            return DB::transaction(
                function () use (
                    $pago,
                    $respuesta
                ) {
                    $pagoBloqueado =
                        Pago::query()
                            ->lockForUpdate()
                            ->findOrFail(
                                $pago->id
                            );

                    $ventaBloqueada =
                        Venta::query()
                            ->with(
                                'entradas'
                            )
                            ->lockForUpdate()
                            ->findOrFail(
                                $pagoBloqueado
                                    ->venta_id
                            );

                    $pagoBloqueado
                        ->update([
                            'proveedor' =>
                                $respuesta[
                                    'proveedor'
                                ],

                            'referencia_proveedor' =>
                                $respuesta[
                                    'referencia_proveedor'
                                ],

                            'estado' =>
                                $respuesta[
                                    'estado'
                                ],

                            'autorizacion_codigo' =>
                                $respuesta[
                                    'autorizacion_codigo'
                                ],

                            'aprobado_en' =>
                                $respuesta[
                                    'estado'
                                ]
                                === 'APROBADO'
                                    ? now()
                                    : null,

                            'descripcion' =>
                                $respuesta[
                                    'descripcion'
                                ]
                                ??
                                $pagoBloqueado
                                    ->descripcion,
                        ]);

                    if (
                        $respuesta[
                            'estado'
                        ]
                        === 'APROBADO'
                    ) {
                        $this
                            ->marcarVentaComoPagada(
                                $ventaBloqueada
                            );
                    } elseif (
                        $respuesta[
                            'estado'
                        ]
                            === 'RECHAZADO'
                        && $ventaBloqueada
                            ->origen
                            === 'COMPRA_WEB'
                    ) {
                        $this
                            ->marcarCompraWebComoFallida(
                                $ventaBloqueada
                            );
                    }

                    $pagoBloqueado
                        ->setAttribute(
                            'client_secret',
                            $respuesta[
                                'client_secret'
                            ] ?? null
                        );

                    return $pagoBloqueado
                        ->load([
                            'venta.entradas',
                            'metodoPago',
                        ]);
                },
                3
            );
        } catch (
            \Throwable $exception
        ) {
            DB::transaction(
                function () use (
                    $pago,
                    $exception
                ) {
                    $pagoBloqueado =
                        Pago::query()
                            ->with(
                                'venta.entradas'
                            )
                            ->lockForUpdate()
                            ->find(
                                $pago->id
                            );

                    if (
                        ! $pagoBloqueado
                    ) {
                        return;
                    }

                    if (
                        $pagoBloqueado
                            ->estado
                        !== 'PENDIENTE'
                    ) {
                        return;
                    }

                    $pagoBloqueado
                        ->update([
                            'estado' =>
                                'RECHAZADO',

                            'descripcion' =>
                                $exception
                                    ->getMessage(),
                        ]);

                    $venta =
                        $pagoBloqueado
                            ->venta;

                    if (
                        $venta
                        && $venta->origen
                            === 'COMPRA_WEB'
                        && $venta->estado
                            === 'PENDIENTE'
                    ) {
                        $this
                            ->marcarCompraWebComoFallida(
                                $venta
                            );
                    }
                }
            );

            throw ValidationException::withMessages([
                'pago' =>
                    'No fue posible procesar el pago con el proveedor externo.',
            ]);
        }
    }

    /**
     * Flujo histórico/general
     * de efectivo.
     */
    private function registrarPagoEfectivo(
        Venta $venta,
        MetodoPago $metodoPago,
        array $datos
    ): Pago {
        return Pago::query()->create([
            'venta_id' =>
                $venta->id,

            'metodo_pago_id' =>
                $metodoPago->id,

            'proveedor' =>
                'TAQUILLA',

            'referencia_proveedor' =>
                null,

            'monto' =>
                $venta->total,

            'moneda' =>
                'GTQ',

            'estado' =>
                'APROBADO',

            'autorizacion_codigo' =>
                null,

            'aprobado_en' =>
                now(),

            'descripcion' =>
                $datos[
                    'descripcion'
                ]
                ?? 'Pago en efectivo registrado en taquilla.',
        ]);
    }

    /**
     * Efectivo presencial.
     *
     * El cambio se calcula siempre
     * en backend.
     */
    private function registrarEfectivoTaquilla(
        Venta $venta,
        MetodoPago $metodoPago,
        array $datos
    ): Pago {
        $efectivoRecibido =
            round(
                (float)
                $datos[
                    'efectivo_recibido'
                ],
                2
            );

        $total =
            round(
                (float)
                $venta->total,
                2
            );

        if (
            $efectivoRecibido
            < $total
        ) {
            throw ValidationException::withMessages([
                'efectivo_recibido' =>
                    'El efectivo recibido es menor que el total de la venta.',
            ]);
        }

        $cambio =
            round(
                $efectivoRecibido
                - $total,
                2
            );

        $descripcion =
            sprintf(
                'Pago en efectivo registrado en taquilla. Recibido: Q%.2f. Cambio: Q%.2f.',
                $efectivoRecibido,
                $cambio
            );

        if (
            ! empty(
                $datos[
                    'descripcion'
                ]
            )
        ) {
            $descripcion .=
                ' '
                . trim(
                    $datos[
                        'descripcion'
                    ]
                );
        }

        return Pago::query()
            ->create([
                'venta_id' =>
                    $venta->id,

                'metodo_pago_id' =>
                    $metodoPago->id,

                'proveedor' =>
                    'TAQUILLA',

                'referencia_proveedor' =>
                    null,

                'monto' =>
                    $venta->total,

                'moneda' =>
                    'GTQ',

                'estado' =>
                    'APROBADO',

                'autorizacion_codigo' =>
                    null,

                'aprobado_en' =>
                    now(),

                'descripcion' =>
                    $descripcion,
            ]);
    }

    /**
     * Tarjeta cobrada mediante
     * terminal POS externo.
     *
     * Atlantic Cinema NO recibe
     * ni almacena datos de tarjeta.
     */
    private function registrarTarjetaPos(
        Venta $venta,
        MetodoPago $metodoPago,
        array $datos
    ): Pago {
        $proveedor =
            trim(
                $datos[
                    'proveedor_pos'
                ]
            );

        $autorizacion =
            trim(
                $datos[
                    'autorizacion_codigo'
                ]
            );

        $referencia =
            isset(
                $datos[
                    'referencia_proveedor'
                ]
            )
                ? trim(
                    $datos[
                        'referencia_proveedor'
                    ]
                )
                : null;

        if (
            $proveedor === ''
        ) {
            throw ValidationException::withMessages([
                'proveedor_pos' =>
                    'Debe indicar el proveedor del POS.',
            ]);
        }

        if (
            $autorizacion === ''
        ) {
            throw ValidationException::withMessages([
                'autorizacion_codigo' =>
                    'Debe indicar el código de autorización del POS.',
            ]);
        }

        return Pago::query()
            ->create([
                'venta_id' =>
                    $venta->id,

                'metodo_pago_id' =>
                    $metodoPago->id,

                /*
                 * Ejemplos:
                 * POS BAC
                 * POS BI
                 * POS G&T
                 */
                'proveedor' =>
                    'POS '
                    . strtoupper(
                        $proveedor
                    ),

                'referencia_proveedor' =>
                    $referencia !== ''
                        ? $referencia
                        : null,

                'monto' =>
                    $venta->total,

                'moneda' =>
                    'GTQ',

                /*
                 * El empleado solamente confirma
                 * este registro después de que el
                 * POS físico indique APROBADO.
                 */
                'estado' =>
                    'APROBADO',

                'autorizacion_codigo' =>
                    $autorizacion,

                'aprobado_en' =>
                    now(),

                'descripcion' =>
                    $datos[
                        'descripcion'
                    ]
                    ?? 'Pago con tarjeta aprobado mediante POS físico de taquilla.',
            ]);
    }

    /**
     * Evita más de un pago
     * aprobado por venta.
     */
    private function validarPagoAprobadoExistente(
        Venta $venta
    ): void {
        $existe =
            Pago::query()
                ->where(
                    'venta_id',
                    $venta->id
                )
                ->where(
                    'estado',
                    'APROBADO'
                )
                ->exists();

        if ($existe) {
            throw ValidationException::withMessages([
                'venta_id' =>
                    'La venta ya posee un pago aprobado.',
            ]);
        }
    }

    /**
     * Marca venta, entradas y asientos
     * como vendidos cuando corresponde.
     */
    private function marcarVentaComoPagada(
        Venta $venta
    ): void {
        $venta->update([
            'estado' =>
                'PAGADA',

            'pagada_en' =>
                now(),
        ]);

        $venta
            ->entradas()
            ->update([
                'estado' =>
                    'VALIDA',
            ]);

        /*
         * COMPRA_WEB y TAQUILLA generan
         * entradas mientras los asientos
         * permanecen BLOQUEADOS.
         *
         * Al aprobar el pago deben pasar
         * definitivamente a VENDIDO.
         */
        if (
            in_array(
                $venta->origen,
                [
                    'COMPRA_WEB',
                    'TAQUILLA',
                ],
                true
            )
        ) {
            $funcionAsientoIds =
                $venta
                    ->entradas()
                    ->pluck(
                        'funcion_asiento_id'
                    );

            FuncionAsiento::query()
                ->whereIn(
                    'id',
                    $funcionAsientoIds
                )
                ->where(
                    'estado',
                    'BLOQUEADO'
                )
                ->update([
                    'estado' =>
                        'VENDIDO',

                    'bloqueado_hasta' =>
                        null,
                ]);
        }
    }

    private function marcarCompraWebComoFallida(
        Venta $venta
    ): void {
        $funcionAsientoIds =
            $venta
                ->entradas()
                ->pluck(
                    'funcion_asiento_id'
                );

        $venta
            ->entradas()
            ->update([
                'estado' =>
                    'CANCELADA',

                'cancelada_en' =>
                    now(),
            ]);

        FuncionAsiento::query()
            ->whereIn(
                'id',
                $funcionAsientoIds
            )
            ->where(
                'estado',
                'BLOQUEADO'
            )
            ->update([
                'estado' =>
                    'DISPONIBLE',

                'bloqueado_hasta' =>
                    null,
            ]);

        $venta->update([
            'estado' =>
                'FALLIDA',
        ]);
    }

    /**
     * Verifica el bloqueo temporal
     * de las ventas cuyos asientos
     * se retienen mientras se paga.
     */
    private function validarVigenciaVentaBloqueada(
        Venta $venta
    ): void {
        if (
            ! in_array(
                $venta->origen,
                [
                    'COMPRA_WEB',
                    'TAQUILLA',
                ],
                true
            )
        ) {
            return;
        }

        $funcionAsientoIds =
            $venta
                ->entradas()
                ->pluck(
                    'funcion_asiento_id'
                );

        $asientos =
            FuncionAsiento::query()
                ->whereIn(
                    'id',
                    $funcionAsientoIds
                )
                ->get();

        if (
            $asientos->isEmpty()
        ) {
            throw ValidationException::withMessages([
                'venta_id' =>
                    'No fue posible verificar los asientos de la venta.',
            ]);
        }

        $bloqueoInvalido =
            $asientos->contains(
                function (
                    FuncionAsiento $asiento
                ): bool {
                    return
                        $asiento->estado
                            !== 'BLOQUEADO'
                        || $asiento
                            ->bloqueado_hasta
                            === null
                        || $asiento
                            ->bloqueado_hasta
                            ->isPast();
                }
            );

        if (
            $bloqueoInvalido
        ) {
            throw ValidationException::withMessages([
                'venta_id' =>
                    'El tiempo disponible para completar esta venta ha vencido.',
            ]);
        }
    }

    private function validarVenta(
        Venta $venta
    ): void {
        if (
            $venta->estado
            === 'PAGADA'
        ) {
            throw ValidationException::withMessages([
                'venta_id' =>
                    'La venta ya se encuentra pagada.',
            ]);
        }

        if (
            $venta->estado
            === 'CANCELADA'
        ) {
            throw ValidationException::withMessages([
                'venta_id' =>
                    'No se puede registrar un pago para una venta cancelada.',
            ]);
        }

        if (
            $venta->estado
            !== 'PENDIENTE'
        ) {
            throw ValidationException::withMessages([
                'venta_id' =>
                    'La venta no se encuentra disponible para recibir pagos.',
            ]);
        }
    }
}