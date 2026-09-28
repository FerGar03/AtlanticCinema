<?php



namespace App\Http\Controllers\Api;



use App\Http\Controllers\Controller;

use App\Http\Requests\ConfirmarPagoSimuladoRequest;

use App\Http\Requests\StorePagoRequest;

use App\Http\Requests\StorePagoTaquillaRequest;

use App\Models\Pago;

use App\Models\Venta;

use App\Services\FacturaService;


use App\Services\Fel\DigifactFelService;
use App\Services\PagoService;

use App\Services\TicketService;

use Illuminate\Database\Eloquent\Builder;

use Illuminate\Http\JsonResponse;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Gate;

use Illuminate\Validation\Rule;

use Illuminate\Validation\ValidationException;

use Throwable;



class PagoController extends Controller

{

    public function __construct(

        private readonly PagoService $pagoService,

        private readonly TicketService $ticketService,

        private readonly FacturaService $facturaService,

        private readonly DigifactFelService $digifactFelService
    ) {

    }



    /**

     * Lista los pagos autorizados

     * para el usuario autenticado.

     *

     * Sin paginar=1 conserva el comportamiento

     * anterior para otros consumidores.

     *

     * Con paginar=1 habilita:

     * - búsqueda

     * - filtros

     * - paginación administrativa

     */

    public function index(

        Request $request

    ): JsonResponse {

        Gate::authorize(

            'viewAny',

            Pago::class

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

                    'APROBADO',

                    'RECHAZADO',

                ]),

            ],



            'metodo' => [

                'nullable',

                'string',

                Rule::in([

                    'EFECTIVO',

                    'TARJETA',

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

            Pago::query()

                ->with([

                    'metodoPago',

                    'venta.cliente',

                    'venta.empleado',

                    'venta.funcion.pelicula',

                    'venta.funcion.sala',

                    'venta.funcion.formato',

                ]);



        /*

         * Un cliente únicamente puede

         * consultar pagos correspondientes

         * a sus propias ventas.

         */

        if (

            $usuario->rol?->nombre

            === 'Cliente'

        ) {

            $consulta->whereHas(

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

         * Filtro por método de pago.

         */

        if (

            ! empty(

                $datos['metodo']

            )

        ) {

            $metodo =

                $datos['metodo'];



            $consulta->whereHas(

                'metodoPago',

                function (

                    Builder $query

                ) use (

                    $metodo

                ): void {

                    $query->where(

                        'codigo',

                        $metodo

                    );

                }

            );

        }



        /*

         * Búsqueda general.

         *

         * Busca por:

         * - número de venta

         * - nombres del cliente

         * - apellidos del cliente

         * - correo

         * - proveedor

         * - referencia

         * - autorización

         * - película

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

                            'proveedor',

                            'ilike',

                            '%'

                            . $termino

                            . '%'

                        )



                        ->orWhere(

                            'referencia_proveedor',

                            'ilike',

                            '%'

                            . $termino

                            . '%'

                        )



                        ->orWhere(

                            'autorizacion_codigo',

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

                        )



                        ->orWhereHas(

                            'venta.funcion.pelicula',

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

                        );

                }

            );

        }



        $consulta->latest(

            'id'

        );



        /*

         * Sin paginar=1 se mantiene

         * la respuesta histórica.

         */

        if (

            ! $request->boolean(

                'paginar'

            )

        ) {

            $pagos =

                $consulta->get();



            return response()->json([

                'message' =>

                    'Pagos obtenidos correctamente.',



                'data' =>

                    $pagos,

            ]);

        }



        $porPagina =

            (int) (

                $datos['per_page']

                ?? 20

            );



        $pagos =

            $consulta->paginate(

                $porPagina

            );



        return response()->json([

            'message' =>

                'Pagos obtenidos correctamente.',



            'data' =>

                $pagos->items(),



            'meta' => [

                'current_page' =>

                    $pagos

                        ->currentPage(),



                'last_page' =>

                    $pagos

                        ->lastPage(),



                'per_page' =>

                    $pagos

                        ->perPage(),



                'total' =>

                    $pagos

                        ->total(),



                'from' =>

                    $pagos

                        ->firstItem(),



                'to' =>

                    $pagos

                        ->lastItem(),

            ],

        ]);

    }



    /**

     * Registra un pago mediante el flujo

     * general de proveedores externos.

     *

     * Este endpoint continúa siendo utilizado

     * principalmente por compra web.

     */

    public function store(

        StorePagoRequest $request

    ): JsonResponse {

        Gate::authorize(

            'create',

            Pago::class

        );



        $venta =

            Venta::query()

                ->findOrFail(

                    $request->integer(

                        'venta_id'

                    )

                );



        Gate::authorize(

            'registrarParaVenta',

            [

                Pago::class,

                $venta,

            ]

        );



        $pago =

            $this

                ->pagoService

                ->registrar(

                    $request->validated()

                );



        return response()->json([

            'message' =>

                'Pago registrado correctamente.',



            'data' =>

                $pago,

        ], 201);

    }



    /**

     * Registra un cobro presencial

     * realizado en taquilla.

     *

     * Métodos:

     * - EFECTIVO

     * - TARJETA mediante POS físico

     */

    public function storeTaquilla(

        StorePagoTaquillaRequest $request

    ): JsonResponse {

        Gate::authorize(
            'create',
            Pago::class
        );

        $venta =
            Venta::query()
                ->findOrFail(
                    $request->integer(
                        'venta_id'
                    )
                );

        Gate::authorize(
            'registrarParaVenta',
            [
                Pago::class,
                $venta,
            ]
        );

        $datosFiscales = $request->validate([
            'nit_receptor' => [
                'nullable',
                'string',
                'max:20',
            ],
        ]);

        $nitReceptor =
            strtoupper(
                preg_replace(
                    '/[^0-9KCF]/i',
                    '',
                    trim(
                        (string) (
                            $datosFiscales['nit_receptor']
                            ?? 'CF'
                        )
                    )
                ) ?? ''
            );

        if (
            $nitReceptor === ''
            || $nitReceptor === 'CF'
        ) {
            $nitReceptor = 'CF';
            $nombreReceptor = 'Consumidor Final';
        } else {
            try {
                $receptor =
                    $this
                        ->digifactFelService
                        ->consultarNit(
                            $nitReceptor
                        );

                $nitReceptor =
                    $receptor['nit'];

                $nombreReceptor =
                    $receptor['nombre'];
            } catch (Throwable $exception) {
                throw ValidationException::withMessages([
                    'nit_receptor' =>
                        $exception->getMessage(),
                ]);
            }
        }

        $pago =
            $this
                ->pagoService
                ->registrarTaquilla(
                    $request->validated()
                );

        $documentos =
            $this->generarDocumentosTaquilla(
                $venta->id,
                [
                    'nit_receptor' =>
                        $nitReceptor,

                    'nombre_receptor' =>
                        $nombreReceptor,
                ]
            );

        return response()->json([
            'message' =>
                'Pago de taquilla registrado correctamente.',

            'data' =>
                $pago,

            'receptor' => [
                'nit' =>
                    $nitReceptor,

                'nombre' =>
                    $nombreReceptor,
            ],

            'documentos' =>
                $documentos,
        ], 201);
    }

    /**
     * Consulta un NIT en Digifact y devuelve
     * el nombre o razón social registrado.
     *
     * Se utiliza desde Taquilla antes de
     * confirmar el cobro.
     */
    public function consultarNit(
        Request $request
    ): JsonResponse {
        Gate::authorize(
            'create',
            Pago::class
        );

        $datos = $request->validate([
            'nit' => [
                'required',
                'string',
                'max:20',
            ],
        ]);

        try {
            $receptor =
                $this
                    ->digifactFelService
                    ->consultarNit(
                        $datos['nit']
                    );
        } catch (Throwable $exception) {
            throw ValidationException::withMessages([
                'nit' =>
                    $exception->getMessage(),
            ]);
        }

        return response()->json([
            'message' =>
                'NIT consultado correctamente.',

            'data' =>
                $receptor,
        ]);
    }




    /**

     * Genera los documentos de una venta de taquilla.

     *

     * En taquilla los documentos quedan disponibles

     * para consulta y descarga, pero no se

     * crean notificaciones de correo para los tickets.

     *

     * Un error documental no revierte el pago ya

     * aprobado. Se devuelve en la respuesta para que

     * pueda recuperarse administrativamente.

     *

     * @param  array\<string, string>  $datosReceptor

     * @return array\<string, mixed>

     */

    private function generarDocumentosTaquilla(

        int $ventaId,

        array $datosReceptor

    ): array {

        $documentos = [

            'tickets' => [],

            'factura' => null,

            'errores' => [],

        ];



        try {

            $tickets =

                $this

                    ->ticketService

                    ->generarParaVenta(

                        $ventaId,

                        false

                    );



            $documentos['tickets'] =

                $tickets

                    ->map(

                        fn ($ticket) => [

                            'id' => $ticket->id,

                            'codigo' => $ticket->codigo,

                            'estado' => $ticket->estado,

                        ]

                    )

                    ->values()

                    ->all();

        } catch (Throwable $exception) {

            $documentos['errores']['tickets'] =

                $exception->getMessage();

        }



        try {

            $factura =

                $this

                    ->facturaService

                    ->generar(

                        $ventaId,

                        $datosReceptor

                    );



            $documentos['factura'] = [

                'id' => $factura->id,

                'numero_interno' =>

                    $factura->numero_interno,

                'serie' => $factura->serie,

                'numero_documento' =>

                    $factura->numero_documento,

                'uuid' => $factura->uuid,

                'estado' => $factura->estado,

            ];

        } catch (Throwable $exception) {

            $documentos['errores']['factura'] =

                $exception->getMessage();

        }



        return $documentos;

    }



    /**

     * Confirma el resultado

     * de un pago simulado.

     */

    public function confirmarSimulacion(

        ConfirmarPagoSimuladoRequest $request,

        Pago $pago

    ): JsonResponse {

        Gate::authorize(

            'confirmarSimulacion',

            $pago

        );



        $pagoConfirmado =

            $this

                ->pagoService

                ->confirmarSimulado(

                    $pago,

                    $request->validated(

                        'resultado'

                    )

                );



        return response()->json([

            'message' =>

                $pagoConfirmado->estado

                    === 'APROBADO'

                    ? 'Pago simulado aprobado correctamente.'

                    : 'Pago simulado rechazado correctamente.',



            'data' =>

                $pagoConfirmado,

        ]);

    }



    /**

     * Muestra un pago específico.

     */

    public function show(

        Pago $pago

    ): JsonResponse {

        Gate::authorize(

            'view',

            $pago

        );



        $pago->load([

            'metodoPago',

            'venta.cliente',

            'venta.empleado',

            'venta.funcion.pelicula',

            'venta.funcion.sala',

            'venta.funcion.formato',

            'venta.entradas.funcionAsiento.asiento',

        ]);



        return response()->json([

            'message' =>

                'Pago obtenido correctamente.',



            'data' =>

                $pago,

        ]);

    }

}
