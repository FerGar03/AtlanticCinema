<?php

namespace App\Services;

use App\Contracts\ProveedorFelInterface;
use App\Models\Factura;
use App\Models\FacturaIntento;
use App\Models\Venta;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class FacturaService
{
    /**
     * Tasa de IVA utilizada actualmente
     * para el régimen general.
     *
     * Los precios de Atlantic Cinema
     * incluyen IVA.
     */
    private const TASA_IVA = 0.12;

    public function __construct(
        private readonly ProveedorFelInterface $proveedorFel
    ) {
    }

    /**
     * Genera y certifica una nueva factura FEL
     * para una venta pagada que todavía no posee
     * una factura registrada.
     *
     * @param  array<string, mixed>  $datosReceptor
     */
    public function generar(
        int $ventaId,
        array $datosReceptor
    ): Factura {
        [
            $factura,
            $intento,
            $datosCertificacion,
        ] = DB::transaction(
            function () use (
                $ventaId,
                $datosReceptor
            ): array {
                $venta =
                    Venta::query()
                        ->with([
                            'entradas.funcionAsiento.asiento',
                            'funcion.pelicula',
                            'funcion.sala',
                            'factura',
                        ])
                        ->lockForUpdate()
                        ->find(
                            $ventaId
                        );

                if (! $venta) {
                    throw ValidationException::withMessages([
                        'venta_id' => [
                            'La venta indicada no existe.',
                        ],
                    ]);
                }

                $this->validarVentaParaFacturacion(
                    $venta
                );

                if (
                    $venta->factura
                    !== null
                ) {
                    throw ValidationException::withMessages([
                        'venta_id' => [
                            'La venta ya posee una factura electrónica.',
                        ],
                    ]);
                }

                [
                    $nitReceptor,
                    $nombreReceptor,
                ] =
                    $this
                        ->normalizarDatosReceptor(
                            $datosReceptor
                        );

                [
                    $subtotalFiscal,
                    $impuestosFactura,
                    $totalVenta,
                ] =
                    $this
                        ->calcularTotalesVenta(
                            $venta
                        );

                /*
                 * La factura se crea una sola vez.
                 *
                 * Si posteriormente la certificación
                 * falla, el reintento reutilizará este
                 * mismo registro.
                 */
                $factura =
                    Factura::query()
                        ->create([
                            'venta_id' =>
                                $venta->id,

                            'numero_interno' =>
                                $this
                                    ->generarNumeroInterno(),

                            'tipo_documento' =>
                                'FACTURA',

                            'serie' =>
                                null,

                            'numero_documento' =>
                                null,

                            'uuid' =>
                                null,

                            'nit_receptor' =>
                                $nitReceptor,

                            'nombre_receptor' =>
                                $nombreReceptor,

                            'subtotal' =>
                                $subtotalFiscal,

                            'descuento' =>
                                0,

                            'impuestos' =>
                                $impuestosFactura,

                            'total' =>
                                $totalVenta,

                            'estado' =>
                                'PENDIENTE',
                        ]);

                $this->crearDetallesFactura(
                    $factura,
                    $venta
                );

                $factura->load(
                    'detalles'
                );

                $datosCertificacion =
                    $this
                        ->construirDatosCertificacion(
                            $factura
                        );

                $intento =
                    $this
                        ->crearIntentoCertificacion(
                            $factura,
                            $datosCertificacion,
                            1
                        );

                return [
                    $factura,
                    $intento,
                    $datosCertificacion,
                ];
            }
        );

        return $this
            ->procesarCertificacion(
                $factura,
                $intento,
                $datosCertificacion
            );
    }

    /**
     * Reintenta certificar una factura
     * previamente registrada en estado ERROR.
     *
     * IMPORTANTE:
     *
     * No crea una factura nueva.
     *
     * Reutiliza:
     * - factura
     * - número interno
     * - detalles
     * - receptor
     * - venta
     *
     * Únicamente crea un nuevo FacturaIntento.
     */
    public function reintentar(
        int $facturaId
    ): Factura {
        [
            $factura,
            $intento,
            $datosCertificacion,
        ] = DB::transaction(
            function () use (
                $facturaId
            ): array {
                $factura =
                    Factura::query()
                        ->with([
                            'venta',
                            'detalles',
                            'intentos',
                        ])
                        ->lockForUpdate()
                        ->find(
                            $facturaId
                        );

                if (! $factura) {
                    throw ValidationException::withMessages([
                        'factura_id' => [
                            'La factura indicada no existe.',
                        ],
                    ]);
                }

                if (
                    $factura->estado
                    === 'CERTIFICADA'
                ) {
                    throw ValidationException::withMessages([
                        'factura_id' => [
                            'La factura ya se encuentra certificada y no necesita reintento.',
                        ],
                    ]);
                }

                if (
                    $factura->estado
                    === 'PENDIENTE'
                ) {
                    throw ValidationException::withMessages([
                        'factura_id' => [
                            'La factura se encuentra pendiente de procesamiento.',
                        ],
                    ]);
                }

                if (
                    $factura->estado
                    !== 'ERROR'
                ) {
                    throw ValidationException::withMessages([
                        'factura_id' => [
                            'Solo es posible reintentar una factura en estado ERROR.',
                        ],
                    ]);
                }

                if (
                    ! $factura->venta
                ) {
                    throw ValidationException::withMessages([
                        'factura_id' => [
                            'La factura no posee una venta asociada.',
                        ],
                    ]);
                }

                if (
                    $factura->venta->estado
                    !== 'PAGADA'
                ) {
                    throw ValidationException::withMessages([
                        'factura_id' => [
                            'La venta asociada ya no se encuentra en estado PAGADA.',
                        ],
                    ]);
                }

                if (
                    $factura->detalles->isEmpty()
                ) {
                    throw ValidationException::withMessages([
                        'factura_id' => [
                            'La factura no posee líneas para certificar.',
                        ],
                    ]);
                }

                /*
                 * Volvemos temporalmente a PENDIENTE
                 * mientras Digifact procesa el nuevo
                 * intento.
                 */
                $factura->update([
                    'estado' =>
                        'PENDIENTE',
                ]);

                $datosCertificacion =
                    $this
                        ->construirDatosCertificacion(
                            $factura
                        );

                $ultimoNumeroIntento =
                    (int)
                    $factura
                        ->intentos()
                        ->max(
                            'numero_intento'
                        );

                $numeroIntento =
                    $ultimoNumeroIntento
                    + 1;

                $intento =
                    $this
                        ->crearIntentoCertificacion(
                            $factura,
                            $datosCertificacion,
                            $numeroIntento
                        );

                return [
                    $factura,
                    $intento,
                    $datosCertificacion,
                ];
            }
        );

        return $this
            ->procesarCertificacion(
                $factura,
                $intento,
                $datosCertificacion
            );
    }

    /**
     * Ejecuta la comunicación con el proveedor FEL.
     *
     * Es utilizada tanto por:
     *
     * - generación inicial;
     * - reintento administrativo.
     */
    private function procesarCertificacion(
        Factura $factura,
        FacturaIntento $intento,
        array $datosCertificacion
    ): Factura {
        try {
            $respuesta =
                $this
                    ->proveedorFel
                    ->certificar(
                        $datosCertificacion
                    );
        } catch (
            Throwable $exception
        ) {
            return $this
                ->registrarExcepcionProveedor(
                    $factura,
                    $intento,
                    $exception
                );
        }

        if (
            ! (
                $respuesta[
                    'exitoso'
                ] ?? false
            )
        ) {
            return $this
                ->registrarErrorProveedor(
                    $factura,
                    $intento,
                    $respuesta
                );
        }

        return $this
            ->registrarCertificacionExitosa(
                $factura,
                $intento,
                $respuesta
            );
    }

    /**
     * Registra una certificación exitosa.
     */
    private function registrarCertificacionExitosa(
        Factura $factura,
        FacturaIntento $intento,
        array $respuesta
    ): Factura {
        return DB::transaction(
            function () use (
                $factura,
                $intento,
                $respuesta
            ): Factura {
                $facturaBloqueada =
                    Factura::query()
                        ->lockForUpdate()
                        ->findOrFail(
                            $factura->id
                        );

                $intentoBloqueado =
                    FacturaIntento::query()
                        ->lockForUpdate()
                        ->findOrFail(
                            $intento->id
                        );

                /*
                 * Digifact devuelve los
                 * identificadores FEL y los
                 * documentos certificados.
                 *
                 * datos_proveedor puede contener:
                 *
                 * - xml_base64
                 * - html_base64
                 * - pdf_base64
                 * - información adicional
                 */
                $facturaBloqueada
                    ->update([
                        'serie' =>
                            $respuesta[
                                'serie'
                            ] ?? null,

                        'numero_documento' =>
                            $respuesta[
                                'numero_documento'
                            ] ?? null,

                        'uuid' =>
                            $respuesta[
                                'uuid'
                            ] ?? null,

                        'datos_proveedor' =>
                            $respuesta[
                                'datos_proveedor'
                            ] ?? null,

                        'estado' =>
                            'CERTIFICADA',

                        'certificada_en' =>
                            now(),
                    ]);

                $intentoBloqueado
                    ->update([
                        'estado' =>
                            'EXITOSO',

                        'codigo_respuesta' =>
                            $respuesta[
                                'codigo_respuesta'
                            ]
                            ?? 'FEL-200',

                        'mensaje_respuesta' =>
                            $respuesta[
                                'mensaje_respuesta'
                            ]
                            ?? 'Factura certificada correctamente.',

                        'respuesta' =>
                            $respuesta,

                        'procesado_en' =>
                            now(),
                    ]);

                return $facturaBloqueada
                    ->fresh([
                        'venta.cliente',
                        'venta.empleado',
                        'venta.funcion.pelicula',
                        'venta.funcion.sala',
                        'venta.funcion.formato',
                        'detalles.entrada.funcionAsiento.asiento',
                        'intentos',
                    ]);
            }
        );
    }

    /**
     * Registra una respuesta negativa
     * devuelta por el proveedor FEL.
     */
    private function registrarErrorProveedor(
        Factura $factura,
        FacturaIntento $intento,
        array $respuesta
    ): Factura {
        DB::transaction(
            function () use (
                $factura,
                $intento,
                $respuesta
            ): void {
                Factura::query()
                    ->whereKey(
                        $factura->id
                    )
                    ->update([
                        'estado' =>
                            'ERROR',
                    ]);

                FacturaIntento::query()
                    ->whereKey(
                        $intento->id
                    )
                    ->update([
                        'estado' =>
                            'ERROR',

                        'codigo_respuesta' =>
                            $respuesta[
                                'codigo_respuesta'
                            ]
                            ?? 'FEL-400',

                        'mensaje_respuesta' =>
                            $respuesta[
                                'mensaje_respuesta'
                            ]
                            ?? 'El proveedor rechazó la factura.',

                        'respuesta' =>
                            $respuesta,

                        'procesado_en' =>
                            now(),
                    ]);
            }
        );

        throw ValidationException::withMessages([
            'factura' => [
                $respuesta[
                    'mensaje_respuesta'
                ]
                ?? 'El proveedor FEL rechazó la factura.',
            ],
        ]);
    }

    /**
     * Registra una excepción técnica
     * durante la comunicación con Digifact.
     */
    private function registrarExcepcionProveedor(
        Factura $factura,
        FacturaIntento $intento,
        Throwable $exception
    ): Factura {
        DB::transaction(
            function () use (
                $factura,
                $intento,
                $exception
            ): void {
                Factura::query()
                    ->whereKey(
                        $factura->id
                    )
                    ->update([
                        'estado' =>
                            'ERROR',
                    ]);

                FacturaIntento::query()
                    ->whereKey(
                        $intento->id
                    )
                    ->update([
                        'estado' =>
                            'ERROR',

                        'codigo_respuesta' =>
                            'FEL-500',

                        'mensaje_respuesta' =>
                            $exception
                                ->getMessage(),

                        'respuesta' => [
                            'excepcion' =>
                                get_class(
                                    $exception
                                ),

                            'mensaje' =>
                                $exception
                                    ->getMessage(),
                        ],

                        'procesado_en' =>
                            now(),
                    ]);
            }
        );

        throw ValidationException::withMessages([
            'factura' => [
                'No fue posible certificar la factura electrónica.',
            ],
        ]);
    }

    /**
     * Crea un nuevo intento de certificación.
     */
    private function crearIntentoCertificacion(
        Factura $factura,
        array $datosCertificacion,
        int $numeroIntento
    ): FacturaIntento {
        return $factura
            ->intentos()
            ->create([
                'numero_intento' =>
                    $numeroIntento,

                'operacion' =>
                    'CERTIFICACION',

                'estado' =>
                    'PENDIENTE',

                'idempotency_key' =>
                    (string)
                    Str::uuid(),

                'solicitud' =>
                    $datosCertificacion,
            ]);
    }

    /**
     * Valida una venta antes de crear
     * una factura FEL.
     */
    private function validarVentaParaFacturacion(
        Venta $venta
    ): void {
        if (
            $venta->estado
            !== 'PAGADA'
        ) {
            throw ValidationException::withMessages([
                'venta_id' => [
                    'Solo es posible facturar una venta pagada.',
                ],
            ]);
        }

        if (
            $venta->entradas->isEmpty()
        ) {
            throw ValidationException::withMessages([
                'venta_id' => [
                    'La venta no posee entradas para facturar.',
                ],
            ]);
        }

        /*
         * El flujo FEL real actualmente
         * se trabaja sin descuentos.
         */
        if (
            round(
                (float)
                $venta->descuento,
                2
            ) !== 0.0
        ) {
            throw ValidationException::withMessages([
                'venta_id' => [
                    'La certificación FEL con descuentos todavía no está habilitada.',
                ],
            ]);
        }

        if (
            round(
                (float)
                $venta->total,
                2
            ) <= 0
        ) {
            throw ValidationException::withMessages([
                'venta_id' => [
                    'El total de la venta debe ser mayor que cero.',
                ],
            ]);
        }
    }

    /**
     * Normaliza los datos fiscales
     * del receptor.
     *
     * @return array{0:string,1:string}
     */
    private function normalizarDatosReceptor(
        array $datosReceptor
    ): array {
        $nitReceptor =
            strtoupper(
                trim(
                    (string) (
                        $datosReceptor[
                            'nit_receptor'
                        ] ?? 'CF'
                    )
                )
            );

        $nombreReceptor =
            trim(
                (string) (
                    $datosReceptor[
                        'nombre_receptor'
                    ] ?? ''
                )
            );

        if (
            $nitReceptor === ''
        ) {
            $nitReceptor =
                'CF';
        }

        if (
            $nombreReceptor === ''
        ) {
            $nombreReceptor =
                $nitReceptor === 'CF'
                    ? 'Consumidor Final'
                    : '';
        }

        if (
            $nombreReceptor === ''
        ) {
            throw ValidationException::withMessages([
                'nombre_receptor' => [
                    'El nombre del receptor es obligatorio.',
                ],
            ]);
        }

        return [
            $nitReceptor,
            $nombreReceptor,
        ];
    }

    /**
     * Calcula los importes fiscales
     * correspondientes a la venta.
     *
     * @return array{0:float,1:float,2:float}
     */
    private function calcularTotalesVenta(
        Venta $venta
    ): array {
        $impuestosFactura =
            0.0;

        $subtotalFiscal =
            0.0;

        foreach (
            $venta->entradas
            as $entrada
        ) {
            $precio =
                round(
                    (float)
                    $entrada->precio,
                    2
                );

            $iva =
                $this
                    ->calcularIvaIncluido(
                        $precio
                    );

            $baseImponible =
                round(
                    $precio - $iva,
                    2
                );

            $subtotalFiscal +=
                $baseImponible;

            $impuestosFactura +=
                $iva;
        }

        $subtotalFiscal =
            round(
                $subtotalFiscal,
                2
            );

        $impuestosFactura =
            round(
                $impuestosFactura,
                2
            );

        $totalVenta =
            round(
                (float)
                $venta->total,
                2
            );

        return [
            $subtotalFiscal,
            $impuestosFactura,
            $totalVenta,
        ];
    }

    /**
     * Crea las líneas de una factura
     * a partir de las entradas de la venta.
     */
    private function crearDetallesFactura(
        Factura $factura,
        Venta $venta
    ): void {
        foreach (
            $venta->entradas
            as $indice => $entrada
        ) {
            $funcionAsiento =
                $entrada
                    ->funcionAsiento;

            $asiento =
                $funcionAsiento
                    ?->asiento;

            $descripcion =
                sprintf(
                    'Entrada para %s - %s - Asiento %s%s',
                    $venta
                        ->funcion
                        ?->pelicula
                        ?->titulo
                    ?? 'Película',

                    $venta
                        ->funcion
                        ?->sala
                        ?->nombre
                    ?? 'Sala',

                    $asiento
                        ?->fila
                    ?? '',

                    $asiento
                        ?->numero
                    ?? $entrada->id
                );

            $precio =
                round(
                    (float)
                    $entrada->precio,
                    2
                );

            $iva =
                $this
                    ->calcularIvaIncluido(
                        $precio
                    );

            $baseImponible =
                round(
                    $precio - $iva,
                    2
                );

            $factura
                ->detalles()
                ->create([
                    'entrada_id' =>
                        $entrada->id,

                    'numero_linea' =>
                        $indice + 1,

                    'descripcion' =>
                        $descripcion,

                    'cantidad' =>
                        1,

                    /*
                     * Precio final,
                     * IVA incluido.
                     */
                    'precio_unitario' =>
                        $precio,

                    'descuento' =>
                        0,

                    /*
                     * Base imponible
                     * sin IVA.
                     */
                    'subtotal' =>
                        $baseImponible,

                    'monto_impuesto' =>
                        $iva,

                    /*
                     * Precio final
                     * de la línea.
                     */
                    'total_linea' =>
                        $precio,
                ]);
        }
    }

    /**
     * Construye la estructura interna
     * enviada al proveedor FEL.
     *
     * @return array<string, mixed>
     */
    private function construirDatosCertificacion(
        Factura $factura
    ): array {
        $factura->loadMissing(
            'detalles'
        );

        return [
            'numero_interno' =>
                $factura
                    ->numero_interno,

            'tipo_documento' =>
                $factura
                    ->tipo_documento,

            'nit_receptor' =>
                $factura
                    ->nit_receptor,

            'nombre_receptor' =>
                $factura
                    ->nombre_receptor,

            'subtotal' =>
                (float)
                $factura
                    ->subtotal,

            'descuento' =>
                (float)
                $factura
                    ->descuento,

            'impuestos' =>
                (float)
                $factura
                    ->impuestos,

            'total' =>
                (float)
                $factura
                    ->total,

            'detalles' =>
                $factura
                    ->detalles
                    ->map(
                        function (
                            $detalle
                        ): array {
                            return [
                                'numero_linea' =>
                                    $detalle
                                        ->numero_linea,

                                'descripcion' =>
                                    $detalle
                                        ->descripcion,

                                'cantidad' =>
                                    (float)
                                    $detalle
                                        ->cantidad,

                                'precio_unitario' =>
                                    (float)
                                    $detalle
                                        ->precio_unitario,

                                'descuento' =>
                                    (float)
                                    $detalle
                                        ->descuento,

                                'subtotal' =>
                                    (float)
                                    $detalle
                                        ->subtotal,

                                'monto_impuesto' =>
                                    (float)
                                    $detalle
                                        ->monto_impuesto,

                                'total_linea' =>
                                    (float)
                                    $detalle
                                        ->total_linea,
                            ];
                        }
                    )
                    ->values()
                    ->all(),
        ];
    }

    /**
     * Calcula el IVA incluido en
     * un precio final.
     *
     * Ejemplo para Q45:
     *
     * Base aproximada: Q40.18
     * IVA aproximado:  Q4.82
     * Total:           Q45.00
     */
    private function calcularIvaIncluido(
        float $monto
    ): float {
        if (
            $monto <= 0
        ) {
            return 0.0;
        }

        $base =
            $monto
            / (
                1
                + self::TASA_IVA
            );

        return round(
            $monto - $base,
            2
        );
    }

    /**
     * Genera el número interno único
     * de Atlantic Cinema.
     */
    private function generarNumeroInterno(): string
    {
        do {
            $numero =
                'FAC-'
                . now()->format(
                    'Ymd'
                )
                . '-'
                . strtoupper(
                    Str::random(
                        10
                    )
                );
        } while (
            Factura::query()
                ->where(
                    'numero_interno',
                    $numero
                )
                ->exists()
        );

        return $numero;
    }
}