<?php

namespace App\Services\Fel;

use App\Contracts\ProveedorFelInterface;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class DigifactFelService implements ProveedorFelInterface
{
    /**
     * Certifica una factura electrónica
     * utilizando la API REST de Digifact.
     *
     * @param  array<string, mixed>  $datosFactura
     * @return array<string, mixed>
     */
    public function certificar(
        array $datosFactura
    ): array {
        $this->validarConfiguracion();

        $token =
            $this->obtenerToken();

        $nuc =
            $this->construirNuc(
                $datosFactura
            );

        $respuesta =
            $this->enviarCertificacion(
                $token,
                $nuc
            );

        return $this
            ->normalizarRespuesta(
                $respuesta
            );
    }

    /**
     * Consulta en Digifact la información
     * asociada a un NIT receptor.
     *
     * Devuelve el NIT y el nombre o
     * razón social registrado.
     *
     * @return array{
     *     nit: string,
     *     nombre: string
     * }
     */
    public function consultarNit(
        string $nit
    ): array {
        $this->validarConfiguracion();

        $nitConsultado =
            strtoupper(
                preg_replace(
                    '/[^0-9K]/i',
                    '',
                    trim($nit)
                ) ?? ''
            );

        if ($nitConsultado === '') {
            throw new RuntimeException(
                'Debe proporcionar un NIT válido.'
            );
        }

        $token =
            $this->obtenerToken();

        $baseUrl =
            rtrim(
                (string) config(
                    'services.digifact.api_url'
                ),
                '/'
            );

        $respuesta =
            Http::acceptJson()
                ->withHeaders([
                    'Authorization' =>
                        $token,
                ])
                ->timeout(20)
                ->get(
                    $baseUrl . '/Shared',
                    [
                        'COUNTRY' =>
                            'GT',

                        'TAXID' =>
                            $this
                                ->normalizarNitEmisor(),

                        'DATA1' =>
                            'SHARED_GETINFONITcom',

                        'DATA2' =>
                            'NIT|' . $nitConsultado,

                        'USERNAME' =>
                            (string) config(
                                'services.digifact.username'
                            ),
                    ]
                );

        if (! $respuesta->successful()) {
            throw new RuntimeException(
                'No fue posible consultar el NIT en Digifact. HTTP '
                . $respuesta->status()
                . '.'
            );
        }

        $data =
            $respuesta->json();

        if (! is_array($data)) {
            throw new RuntimeException(
                'Digifact devolvió una respuesta inválida al consultar el NIT.'
            );
        }

        /*
         * Dependiendo de la respuesta del
         * endpoint Shared, buscamos primero
         * una colección RESPONSE.
         */
        $registro =
            $data['RESPONSE'][0]
            ?? null;

        /*
         * Compatibilidad adicional por si
         * Digifact devuelve directamente
         * un único registro.
         */
        if (
            ! is_array($registro)
            && isset(
                $data['NIT'],
                $data['NOMBRE']
            )
        ) {
            $registro =
                $data;
        }

        if (
            ! is_array($registro)
            || empty(
                $registro['NIT']
            )
            || empty(
                $registro['NOMBRE']
            )
        ) {
            throw new RuntimeException(
                'No se encontró información para el NIT indicado.'
            );
        }

        return [
            'nit' =>
                strtoupper(
                    trim(
                        (string)
                        $registro['NIT']
                    )
                ),

            'nombre' =>
                trim(
                    (string)
                    $registro['NOMBRE']
                ),
        ];
    }

    /**
     * Obtiene un JWT desde Digifact TEST.
     */
    private function obtenerToken(): string
    {
        $baseUrl =
            rtrim(
                (string) config(
                    'services.digifact.api_url'
                ),
                '/'
            );

        $usernameCompleto =
            $this->construirUsernameCompleto();

        $respuesta =
            Http::acceptJson()
                ->asJson()
                ->timeout(20)
                ->post(
                    $baseUrl
                    . '/login/get_token',
                    [
                        'Username' =>
                            $usernameCompleto,

                        'Password' =>
                            config(
                                'services.digifact.password'
                            ),
                    ]
                );

        if (! $respuesta->successful()) {
            throw new RuntimeException(
                'No fue posible autenticarse con Digifact. HTTP '
                . $respuesta->status()
                . '.'
            );
        }

        /*
         * El ambiente TEST devuelve "Token"
         * con T mayúscula.
         *
         * Conservamos compatibilidad con
         * "token" por si Digifact cambia
         * posteriormente la respuesta.
         */
        $token =
            $respuesta->json(
                'Token'
            )
            ?? $respuesta->json(
                'token'
            );

        if (
            ! is_string($token)
            || trim($token) === ''
        ) {
            throw new RuntimeException(
                'Digifact no devolvió un token JWT válido.'
            );
        }

        return trim(
            $token
        );
    }

    /**
     * Envía el NUC JSON al endpoint
     * de certificación V2.
     *
     * @param  array<string, mixed>  $nuc
     */
    private function enviarCertificacion(
        string $token,
        array $nuc
    ): Response {
        $baseUrl =
            rtrim(
                (string) config(
                    'services.digifact.api_url'
                ),
                '/'
            );

        return Http::acceptJson()
            ->asJson()
            ->withHeaders([
                'Authorization' =>
                    $token,
            ])
            ->timeout(30)
            ->withQueryParameters([
                /*
                 * Para los parámetros de la API
                 * Digifact utiliza el NIT
                 * completado a 12 dígitos.
                 */
                'TAXID' =>
                    $this
                        ->normalizarNitEmisor(),

                'FORMAT' =>
                    (string) config(
                        'services.digifact.format',
                        'PDF|HTML|XML'
                    ),

                /*
                 * Aquí se utiliza únicamente
                 * el nombre de usuario asignado.
                 */
                'USERNAME' =>
                    (string) config(
                        'services.digifact.username'
                    ),
            ])
            ->post(
                $baseUrl
                . '/v2/transform/nuc_json',
                $nuc
            );
    }

    /**
     * Convierte la respuesta específica de
     * Digifact al contrato interno utilizado
     * por FacturaService.
     *
     * @return array<string, mixed>
     */
    private function normalizarRespuesta(
        Response $respuesta
    ): array {
        $data =
            $respuesta->json();

        if (! is_array($data)) {
            throw new RuntimeException(
                'Digifact devolvió una respuesta que no pudo interpretarse como JSON.'
            );
        }

        $codigo =
            (string) (
                $data[
                    'code'
                ] ?? ''
            );

        $exitoso =
            $respuesta->successful()
            && $codigo === '1';

        $mensaje =
            $data[
                'message'
            ] ?? null;

        $descripcion =
            $data[
                'description'
            ] ?? null;

        if (
            (
                ! is_string($mensaje)
                || trim($mensaje) === ''
            )
            && is_string($descripcion)
            && trim($descripcion) !== ''
        ) {
            $mensaje =
                $descripcion;
        }

        if (
            ! is_string($mensaje)
            || trim($mensaje) === ''
        ) {
            $mensaje =
                $exitoso
                    ? 'Documento certificado correctamente por Digifact.'
                    : 'Digifact rechazó la certificación del documento.';
        }

        return [
            'exitoso' =>
                $exitoso,

            'codigo_respuesta' =>
                $codigo !== ''
                    ? $codigo
                    : 'DIGIFACT-ERROR',

            'mensaje_respuesta' =>
                $mensaje,

            /*
             * Digifact denomina batch a la serie
             * y serial al número correlativo.
             */
            'serie' =>
                $data[
                    'batch'
                ] ?? null,

            'numero_documento' =>
                isset(
                    $data[
                        'serial'
                    ]
                )
                    ? (string)
                        $data[
                            'serial'
                        ]
                    : null,

            /*
             * authNumber corresponde al UUID
             * o número de autorización FEL.
             */
            'uuid' =>
                $data[
                    'authNumber'
                ] ?? null,

            'certificada_en' =>
                $data[
                    'enrolledTimeStamp'
                ]
                ?? $data[
                    'issuedTimeStamp'
                ]
                ?? null,

            /*
             * Información adicional para
             * auditoría y diagnóstico.
             */
            'datos_proveedor' => [
                'proveedor' =>
                    'DIGIFACT',

                'ambiente' =>
                    config(
                        'services.digifact.environment',
                        'test'
                    ),

                'http_status' =>
                    $respuesta->status(),

                'description' =>
                    $descripcion,

                'info_details' =>
                    $data[
                        'infoDetails'
                    ] ?? null,

                'additional_info' =>
                    $data[
                        'additionalInfo'
                    ] ?? null,

                /*
                 * Documentos devueltos por
                 * Digifact en Base64.
                 */
                'xml_base64' =>
                    $data[
                        'responseData1'
                    ] ?? null,

                'html_base64' =>
                    $data[
                        'responseData2'
                    ] ?? null,

                'pdf_base64' =>
                    $data[
                        'responseData3'
                    ] ?? null,

                'tax_id' =>
                    $data[
                        'taxID'
                    ] ?? null,

                'issuer_name' =>
                    $data[
                        'name'
                    ] ?? null,

                'branch_code' =>
                    $data[
                        'branchCode'
                    ] ?? null,

                'branch_name' =>
                    $data[
                        'branchName'
                    ] ?? null,

                'receiver_tax_id' =>
                    $data[
                        'receiverTaxID'
                    ] ?? null,

                'receiver_name' =>
                    $data[
                        'receiverName'
                    ] ?? null,

                'total_amount' =>
                    $data[
                        'totalAmount'
                    ] ?? null,
            ],
        ];
    }

    /**
     * Construye el NUC JSON correspondiente
     * a una FACT.
     *
     * Los precios manejados por Atlantic Cinema
     * incluyen IVA.
     *
     * @param  array<string, mixed>  $datosFactura
     * @return array<string, mixed>
     */
    private function construirNuc(
        array $datosFactura
    ): array {
        $detalles =
            $datosFactura[
                'detalles'
            ] ?? [];

        if (
            ! is_array($detalles)
            || $detalles === []
        ) {
            throw new RuntimeException(
                'La factura no contiene detalles para certificar.'
            );
        }

        $items = [];
        $totalIva = 0.0;
        $totalCalculado = 0.0;

        foreach (
            $detalles
            as $indice => $detalle
        ) {
            $cantidad =
                round(
                    (float) (
                        $detalle[
                            'cantidad'
                        ] ?? 1
                    ),
                    6
                );

            $precioUnitario =
                round(
                    (float) (
                        $detalle[
                            'precio_unitario'
                        ] ?? 0
                    ),
                    6
                );

            $descuento =
                round(
                    (float) (
                        $detalle[
                            'descuento'
                        ] ?? 0
                    ),
                    6
                );

            $totalLinea =
                round(
                    (float) (
                        $detalle[
                            'total_linea'
                        ]
                        ?? (
                            (
                                $cantidad
                                * $precioUnitario
                            )
                            - $descuento
                        )
                    ),
                    6
                );

            if (
                $cantidad <= 0
                || $precioUnitario <= 0
                || $totalLinea <= 0
            ) {
                throw new RuntimeException(
                    'Uno de los detalles de la factura contiene cantidades o montos inválidos.'
                );
            }

            /*
             * Régimen general:
             * los precios de Atlantic Cinema
             * incluyen IVA.
             */
            $baseImponible =
                round(
                    $totalLinea / 1.12,
                    6
                );

            $iva =
                round(
                    $totalLinea
                    - $baseImponible,
                    6
                );

            $totalIva +=
                $iva;

            $totalCalculado +=
                $totalLinea;

            $items[] = [
                'Number' =>
                    (string) (
                        $indice + 1
                    ),

                'Codes' =>
                    null,

                'Type' =>
                    'Servicio',

                'Description' =>
                    trim(
                        (string) (
                            $detalle[
                                'descripcion'
                            ]
                            ?? 'Entrada Atlantic Cinema'
                        )
                    ),

                'Qty' =>
                    $this
                        ->formatearDecimal(
                            $cantidad
                        ),

                'UnitOfMeasure' =>
                    'SER',

                'Price' =>
                    $this
                        ->formatearDecimal(
                            $precioUnitario
                        ),

                'Discounts' =>
                    $descuento > 0
                        ? [
                            'Discount' => [
                                [
                                    'Amount' =>
                                        $this
                                            ->formatearDecimal(
                                                $descuento
                                            ),
                                ],
                            ],
                        ]
                        : null,

                'Taxes' => [
                    'Tax' => [
                        [
                            'Code' =>
                                '1',

                            'Description' =>
                                'IVA',

                            'TaxableAmount' =>
                                $this
                                    ->formatearDecimal(
                                        $baseImponible
                                    ),

                            'Amount' =>
                                $this
                                    ->formatearDecimal(
                                        $iva
                                    ),
                        ],
                    ],
                ],

                'Totals' => [
                    'TotalItem' =>
                        $this
                            ->formatearDecimal(
                                $totalLinea
                            ),
                ],
            ];
        }

        $nitReceptor =
            strtoupper(
                trim(
                    (string) (
                        $datosFactura[
                            'nit_receptor'
                        ] ?? 'CF'
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
                    $datosFactura[
                        'nombre_receptor'
                    ] ?? ''
                )
            );

        if ($nombreReceptor === '') {
            $nombreReceptor =
                $nitReceptor === 'CF'
                    ? 'CONSUMIDOR FINAL'
                    : 'RECEPTOR';
        }

        $totalFactura =
            round(
                (float) (
                    $datosFactura[
                        'total'
                    ] ?? $totalCalculado
                ),
                6
            );

        if ($totalFactura <= 0) {
            throw new RuntimeException(
                'El total de la factura debe ser mayor que cero.'
            );
        }

        $referenciaInterna =
            (string) Str::uuid();

        return [
            'Version' =>
                '1.00',

            'CountryCode' =>
                'GT',

            'Header' => [
                'DocType' =>
                    'FACT',

                'IssuedDateTime' =>
                    now()
                        ->timezone(
                            'America/Guatemala'
                        )
                        ->format(
                            'Y-m-d\TH:i:sP'
                        ),

                'Currency' =>
                    'GTQ',
            ],

            'Seller' => [
                /*
                 * IMPORTANTE:
                 *
                 * Dentro del DTE se utiliza el
                 * NIT fiscal real, SIN completar
                 * a 12 dígitos.
                 *
                 * Ejemplo:
                 * 5888492
                 *
                 * Los 12 dígitos se utilizan
                 * únicamente para autenticación
                 * y TAXID de la API.
                 */
                'TaxID' =>
                    $this
                        ->obtenerNitFiscalEmisor(),

                'TaxIDAdditionalInfo' => [
                    [
                        'Name' =>
                            'AfiliacionIVA',

                        'Data' =>
                            null,

                        'Value' =>
                            (string) config(
                                'services.digifact.vat_affiliation',
                                'GEN'
                            ),
                    ],
                ],

                'Name' =>
                    (string) config(
                        'services.digifact.issuer_name'
                    ),

                /*
                 * "AdditionlInfo" se mantiene
                 * exactamente como lo utiliza
                 * el esquema de Digifact.
                 */
                'AdditionlInfo' => [
                    [
                        'Name' =>
                            'TipoFrase',

                        'Data' =>
                            '1',

                        'Value' =>
                            (string) config(
                                'services.digifact.phrase_type',
                                '1'
                            ),
                    ],
                    [
                        'Name' =>
                            'Escenario',

                        'Data' =>
                            '1',

                        'Value' =>
                            (string) config(
                                'services.digifact.phrase_scenario',
                                '2'
                            ),
                    ],
                ],

                'BranchInfo' => [
                    'Code' =>
                        (string) config(
                            'services.digifact.branch_code',
                            '2'
                        ),

                    'Name' =>
                        (string) config(
                            'services.digifact.branch_name'
                        ),

                    'AddressInfo' => [
                        'Address' =>
                            (string) config(
                                'services.digifact.address'
                            ),

                        'City' =>
                            (string) config(
                                'services.digifact.city_code'
                            ),

                        'District' =>
                            (string) config(
                                'services.digifact.district'
                            ),

                        'State' =>
                            (string) config(
                                'services.digifact.state'
                            ),

                        'Country' =>
                            'GT',
                    ],
                ],
            ],

            'Buyer' => [
                'TaxID' =>
                    $nitReceptor,

                'Name' =>
                    $nombreReceptor,

                'AddressInfo' => [
                    'Address' =>
                        'CIUDAD',

                    'City' =>
                        (string) config(
                            'services.digifact.city_code'
                        ),

                    'District' =>
                        (string) config(
                            'services.digifact.district'
                        ),

                    'State' =>
                        (string) config(
                            'services.digifact.state'
                        ),

                    'Country' =>
                        'GT',
                ],
            ],

            'ThirdParties' =>
                null,

            'Items' =>
                $items,

            'Totals' => [
                'TotalTaxes' => [
                    'TotalTax' => [
                        [
                            'Description' =>
                                'IVA',

                            'Amount' =>
                                $this
                                    ->formatearDecimal(
                                        $totalIva
                                    ),
                        ],
                    ],
                ],

                'GrandTotal' => [
                    'InvoiceTotal' =>
                        $this
                            ->formatearDecimal(
                                $totalFactura
                            ),
                ],
            ],

            /*
             * Adenda mínima requerida para
             * esta integración de pruebas.
             */
            'AdditionalDocumentInfo' => [
                'AdditionalInfo' => [
                    [
                        'Code' =>
                            $referenciaInterna,

                        'Type' =>
                            'ADENDA',

                        'AditionalInfo' => [
                            [
                                'Name' =>
                                    'VALIDAR_REFERENCIA_INTERNA',

                                'Data' =>
                                    null,

                                'Value' =>
                                    'NO_VALIDAR',
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * Verifica que estén configurados todos
     * los valores requeridos por Digifact.
     */
    private function validarConfiguracion(): void
    {
        $campos = [
            'api_url',
            'tax_id',
            'username',
            'password',
            'issuer_name',
            'vat_affiliation',
            'phrase_type',
            'phrase_scenario',
            'branch_code',
            'branch_name',
            'address',
            'city_code',
            'district',
            'state',
        ];

        foreach ($campos as $campo) {
            $valor =
                config(
                    'services.digifact.'
                    . $campo
                );

            if (
                ! is_string($valor)
                && ! is_numeric($valor)
            ) {
                throw new RuntimeException(
                    'Falta configurar DIGIFACT_'
                    . strtoupper(
                        $campo
                    )
                    . '.'
                );
            }

            if (
                trim(
                    (string) $valor
                ) === ''
            ) {
                throw new RuntimeException(
                    'Falta configurar DIGIFACT_'
                    . strtoupper(
                        $campo
                    )
                    . '.'
                );
            }
        }
    }

    /**
     * Construye el usuario utilizado
     * por el login:
     *
     * GT.NIT_12_DIGITOS.USUARIO
     */
    private function construirUsernameCompleto(): string
    {
        return 'GT.'
            . $this
                ->normalizarNitEmisor()
            . '.'
            . trim(
                (string) config(
                    'services.digifact.username'
                )
            );
    }

    /**
     * Devuelve el NIT fiscal real del
     * emisor para colocarlo dentro del DTE.
     *
     * No agrega ceros a la izquierda.
     */
    private function obtenerNitFiscalEmisor(): string
    {
        $nit =
            preg_replace(
                '/\D/',
                '',
                (string) config(
                    'services.digifact.tax_id'
                )
            );

        if (
            ! is_string($nit)
            || $nit === ''
        ) {
            throw new RuntimeException(
                'El NIT fiscal configurado para Digifact no es válido.'
            );
        }

        return $nit;
    }

    /**
     * Convierte el NIT a exactamente
     * 12 dígitos.
     *
     * Se utiliza únicamente para:
     *
     * - autenticación;
     * - parámetro TAXID de la API.
     */
    private function normalizarNitEmisor(): string
    {
        $nit =
            $this
                ->obtenerNitFiscalEmisor();

        return str_pad(
            $nit,
            12,
            '0',
            STR_PAD_LEFT
        );
    }

    /**
     * Digifact admite hasta seis
     * decimales en diferentes campos
     * del NUC.
     */
    private function formatearDecimal(
        mixed $valor
    ): string {
        return number_format(
            (float) $valor,
            6,
            '.',
            ''
        );
    }
}