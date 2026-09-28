<?php



namespace App\Services;



use App\Models\Notificacion;

use App\Models\Ticket;

use App\Models\Venta;

use Illuminate\Database\Eloquent\Collection;

use Illuminate\Support\Facades\DB;

use Illuminate\Support\Str;

use Illuminate\Validation\ValidationException;



class TicketService

{

    /**

     * Genera únicamente los tickets que hagan

     * falta para una venta pagada.

     *

     * Reglas:

     *

     * - La venta debe existir.

     * - La venta debe estar PAGADA.

     * - Solamente se genera ticket para entradas VALIDA.

     * - Si ya existe un ticket ACTIVO, se reutiliza.

     * - Si el ticket ya fue UTILIZADO, tampoco se duplica.

     * - Un ticket CANCELADO o INVALIDADO no impide crear

     *   una nueva versión si la entrada continúa VALIDA.

     * - La ausencia o fallo del correo nunca debe impedir

     *   la creación del ticket.

     *

     * @throws ValidationException

     */

    public function generarParaVenta(

        int $ventaId,

        bool $crearNotificacion = true

    ): Collection {

        return DB::transaction(

            function () use (

                $ventaId,

                $crearNotificacion

            ): Collection {

                $venta =

                    Venta::query()

                        ->with([

                            'cliente',

                            'factura',

                            'entradas',

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



                if (

                    $venta->estado

                    !== 'PAGADA'

                ) {

                    throw ValidationException::withMessages([

                        'venta_id' => [

                            'Solo se pueden generar tickets para una venta pagada.',

                        ],

                    ]);

                }



                if (

                    $venta->entradas

                        ->isEmpty()

                ) {

                    throw ValidationException::withMessages([

                        'venta_id' => [

                            'La venta no tiene entradas asociadas.',

                        ],

                    ]);

                }



                $ticketsResultado =

                    new Collection();



                foreach (

                    $venta->entradas

                    as $entrada

                ) {

                    /*

                     * Si ya existe un ticket válido

                     * para la operación normal de

                     * esta entrada, no generamos

                     * uno nuevo.

                     *

                     * UTILIZADO también se considera

                     * cubierto, porque un ticket ya

                     * utilizado nunca debe reemitirse

                     * automáticamente.

                     */

                    $ticketExistente =

                        Ticket::query()

                            ->where(

                                'entrada_id',

                                $entrada->id

                            )

                            ->whereIn(

                                'estado',

                                [

                                    'ACTIVO',

                                    'UTILIZADO',

                                ]

                            )

                            ->latest(

                                'version'

                            )

                            ->lockForUpdate()

                            ->first();



                    if (

                        $ticketExistente

                    ) {

                        $ticketsResultado

                            ->push(

                                $ticketExistente

                            );



                        continue;

                    }



                    /*

                     * Solamente una entrada VALIDA

                     * puede recibir un nuevo ticket.

                     *

                     * Una entrada UTILIZADA,

                     * CANCELADA, REEMBOLSADA, etc.

                     * no debe reemitirse por este

                     * mecanismo de recuperación.

                     */

                    if (

                        $entrada->estado

                        !== 'VALIDA'

                    ) {

                        continue;

                    }



                    $ultimaVersion =

                        Ticket::query()

                            ->where(

                                'entrada_id',

                                $entrada->id

                            )

                            ->max(

                                'version'

                            );



                    $ticket =

                        Ticket::query()

                            ->create([

                                'entrada_id' =>

                                    $entrada->id,



                                'codigo' =>

                                    $this

                                        ->generarCodigo(),



                                'token_validacion' =>

                                    $this

                                        ->generarToken(),



                                'formato' =>

                                    'DIGITAL',



                                'estado' =>

                                    'ACTIVO',



                                'pdf_url' =>

                                    null,



                                'qr_url' =>

                                    null,



                                'generado_en' =>

                                    now(),



                                'version' =>

                                    (

                                        (int)

                                        $ultimaVersion

                                    ) + 1,

                            ]);



                    /*

                     * La generación del ticket NO

                     * depende del correo electrónico.

                     *

                     * Si existe un cliente con correo,

                     * creamos la notificación para que

                     * pueda procesarse posteriormente.

                     *

                     * Si no existe correo, el ticket

                     * continúa siendo completamente

                     * válido y descargable.

                     */

                    if (

                        $crearNotificacion

                        && $venta->cliente

                        && filled(

                            $venta

                                ->cliente

                                ->correo

                        )

                    ) {

                        Notificacion::query()

                            ->create([

                                'usuario_id' =>

                                    $venta

                                        ->cliente_id,



                                'venta_id' =>

                                    $venta->id,



                                'reserva_id' =>

                                    $venta

                                        ->reserva_id,



                                /*

                                 * Si la factura ya existe,

                                 * dejamos también la relación

                                 * explícita.

                                 *

                                 * Si todavía no existe,

                                 * simplemente queda NULL.

                                 */

                                'factura_id' =>

                                    $venta

                                        ->factura

                                        ?->id,



                                'ticket_id' =>

                                    $ticket->id,



                                'canal' =>

                                    'EMAIL',



                                'destinatario' =>

                                    $venta

                                        ->cliente

                                        ->correo,



                                'asunto' =>

                                    'Ticket electrónico de Atlantic Cinema',



                                'mensaje' =>

                                    sprintf(

                                        'Se ha generado correctamente el ticket %s correspondiente a la venta %s.',

                                        $ticket->codigo,

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



                    $ticketsResultado

                        ->push(

                            $ticket

                        );

                }



                return $ticketsResultado

                    ->load([

                        'entrada',

                        'notificaciones',

                    ]);

            },

            3

        );

    }



    /**

     * Cuenta cuántas entradas de una venta

     * necesitan realmente un ticket.

     *

     * Se considera pendiente cuando:

     *

     * - la entrada está VALIDA;

     * - no posee ticket ACTIVO;

     * - no posee ticket UTILIZADO.

     */

    public function contarFaltantes(

        Venta $venta

    ): int {

        $venta->loadMissing(

            'entradas'

        );



        $entradaIds =

            $venta

                ->entradas

                ->where(

                    'estado',

                    'VALIDA'

                )

                ->pluck(

                    'id'

                );



        if (

            $entradaIds->isEmpty()

        ) {

            return 0;

        }



        $entradasCubiertas =

            Ticket::query()

                ->whereIn(

                    'entrada_id',

                    $entradaIds

                )

                ->whereIn(

                    'estado',

                    [

                        'ACTIVO',

                        'UTILIZADO',

                    ]

                )

                ->distinct()

                ->pluck(

                    'entrada_id'

                );



        return $entradaIds

            ->diff(

                $entradasCubiertas

            )

            ->count();

    }



    /**

     * Genera un código público único

     * para el ticket.

     */

    private function generarCodigo(): string

    {

        do {

            $codigo =

                'TKT-'

                . Str::upper(

                    Str::random(

                        12

                    )

                );

        } while (

            Ticket::query()

                ->where(

                    'codigo',

                    $codigo

                )

                ->exists()

        );



        return $codigo;

    }



    /**

     * Genera un token único para

     * la validación del ticket.

     */

    private function generarToken(): string

    {

        do {

            $token =

                hash(

                    'sha256',

                    Str::uuid()

                        ->toString()

                    . Str::random(

                        64

                    )

                    . microtime(

                        true

                    )

                );

        } while (

            Ticket::query()

                ->where(

                    'token_validacion',

                    $token

                )

                ->exists()

        );



        return $token;

    }

}