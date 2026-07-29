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
     * Genera los tickets electrónicos correspondientes a una venta pagada.
     *
     * @throws ValidationException
     */
    public function generarParaVenta(int $ventaId): Collection
    {
        return DB::transaction(function () use ($ventaId) {
            $venta = Venta::query()
                ->with([
                    'cliente',
                    'entradas',
                ])
                ->lockForUpdate()
                ->find($ventaId);

            if (! $venta) {
                throw ValidationException::withMessages([
                    'venta_id' => [
                        'La venta indicada no existe.',
                    ],
                ]);
            }

            if ($venta->estado !== 'PAGADA') {
                throw ValidationException::withMessages([
                    'venta_id' => [
                        'Solo se pueden generar tickets para una venta pagada.',
                    ],
                ]);
            }

            if (! $venta->cliente) {
                throw ValidationException::withMessages([
                    'venta_id' => [
                        'La venta no tiene un cliente asociado.',
                    ],
                ]);
            }

            if (! $venta->cliente->correo) {
                throw ValidationException::withMessages([
                    'venta_id' => [
                        'El cliente no tiene un correo electrónico registrado.',
                    ],
                ]);
            }

            if ($venta->entradas->isEmpty()) {
                throw ValidationException::withMessages([
                    'venta_id' => [
                        'La venta no tiene entradas asociadas.',
                    ],
                ]);
            }

            $entradasInvalidas = $venta->entradas
                ->where('estado', '!=', 'VALIDA');

            if ($entradasInvalidas->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'venta_id' => [
                        'Todas las entradas de la venta deben encontrarse en estado VALIDA.',
                    ],
                ]);
            }

            $ticketsGenerados = new Collection();

            foreach ($venta->entradas as $entrada) {
                $ticketActivo = Ticket::query()
                    ->where('entrada_id', $entrada->id)
                    ->where('estado', 'ACTIVO')
                    ->lockForUpdate()
                    ->first();

                if ($ticketActivo) {
                    $ticketsGenerados->push($ticketActivo);

                    continue;
                }

                $ultimaVersion = Ticket::query()
                    ->where('entrada_id', $entrada->id)
                    ->max('version');

                $ticket = Ticket::create([
                    'entrada_id' => $entrada->id,
                    'codigo' => $this->generarCodigo(),
                    'token_validacion' => $this->generarToken(),
                    'formato' => 'DIGITAL',
                    'estado' => 'ACTIVO',
                    'pdf_url' => null,
                    'qr_url' => null,
                    'generado_en' => now(),
                    'version' => ((int) $ultimaVersion) + 1,
                ]);

                Notificacion::create([
                    'usuario_id' => $venta->cliente_id,
                    'venta_id' => $venta->id,
                    'reserva_id' => $venta->reserva_id,
                    'factura_id' => null,
                    'ticket_id' => $ticket->id,
                    'canal' => 'EMAIL',
                    'destinatario' => $venta->cliente->correo,
                    'asunto' => 'Ticket electrónico de Atlantic Cinema',
                    'mensaje' => sprintf(
                        'Se ha generado correctamente el ticket %s correspondiente a la venta %s.',
                        $ticket->codigo,
                        $venta->numero_venta
                    ),
                    'estado' => 'PENDIENTE',
                    'enviada_en' => null,
                    'leida_en' => null,
                ]);

                $ticketsGenerados->push($ticket);
            }

            return $ticketsGenerados->load([
                'entrada',
                'notificaciones',
            ]);
        });
    }

    /**
     * Genera un código público único para el ticket.
     */
    private function generarCodigo(): string
    {
        do {
            $codigo = 'TKT-' . Str::upper(Str::random(12));
        } while (
            Ticket::query()
                ->where('codigo', $codigo)
                ->exists()
        );

        return $codigo;
    }

    /**
     * Genera un token único para la validación del ticket.
     */
    private function generarToken(): string
    {
        do {
            $token = hash(
                'sha256',
                Str::uuid()->toString() . Str::random(64) . microtime(true)
            );
        } while (
            Ticket::query()
                ->where('token_validacion', $token)
                ->exists()
        );

        return $token;
    }
}