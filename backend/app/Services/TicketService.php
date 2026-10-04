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
     * - Si se generan uno o varios tickets nuevos, se crea
     *   una sola notificación EMAIL asociada a la venta.
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

                $ticketsNuevos =
                    0;

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

                    if ($ticketExistente) {
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

                    $ticketsNuevos++;

                    $ticketsResultado
                        ->push(
                            $ticket
                        );
                }

                /*
                 * Unificamos el correo por venta.
                 *
                 * Aunque se hayan generado varios
                 * tickets, solo se crea una
                 * notificación EMAIL.
                 *
                 * La notificación no se enlaza a un
                 * ticket específico; NotificacionService
                 * obtiene todos los tickets de la venta
                 * y los adjunta en un único correo.
                 *
                 * Si no se generó ningún ticket nuevo
                 * (por ejemplo, un replay del webhook),
                 * no se crea una nueva notificación.
                 */
                if (
                    $crearNotificacion
                    && $ticketsNuevos > 0
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

                            'factura_id' =>
                                $venta
                                    ->factura
                                    ?->id,

                            'ticket_id' =>
                                null,

                            'canal' =>
                                'EMAIL',

                            'destinatario' =>
                                $venta
                                    ->cliente
                                    ->correo,

                            'asunto' =>
                                'Compra confirmada - Atlantic Cinema',

                            'mensaje' =>
                                sprintf(
                                    'Tu compra %s fue confirmada correctamente y tus documentos están listos.',
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

                return $ticketsResultado
                    ->load([
                        'entrada',
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
