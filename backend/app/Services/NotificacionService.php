<?php

namespace App\Services;

use App\Models\Notificacion;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class NotificacionService
{
    /**
     * Procesa una notificación pendiente.
     *
     * En esta etapa del MVP se simula el envío y se registra
     * inmediatamente como ENVIADA.
     */
    public function procesar(int $notificacionId): Notificacion
    {
        return DB::transaction(function () use ($notificacionId): Notificacion {
            $notificacion = Notificacion::query()
                ->lockForUpdate()
                ->find($notificacionId);

            if (! $notificacion) {
                throw ValidationException::withMessages([
                    'notificacion_id' => [
                        'La notificación indicada no existe.',
                    ],
                ]);
            }

            if ($notificacion->estado !== 'PENDIENTE') {
                throw ValidationException::withMessages([
                    'notificacion_id' => [
                        'La notificación no se encuentra pendiente.',
                    ],
                ]);
            }

            if (blank($notificacion->destinatario)) {
                throw ValidationException::withMessages([
                    'destinatario' => [
                        'La notificación no tiene un destinatario válido.',
                    ],
                ]);
            }

            if (! in_array(
                $notificacion->canal,
                ['EMAIL', 'SMS', 'PUSH', 'SISTEMA'],
                true
            )) {
                throw ValidationException::withMessages([
                    'canal' => [
                        'El canal de la notificación no es válido.',
                    ],
                ]);
            }

            $notificacion->update([
                'estado' => 'ENVIADA',
                'enviada_en' => now(),
            ]);

            return $notificacion->fresh([
                'usuario',
                'venta',
                'reserva',
                'factura',
                'ticket',
            ]);
        }, 3);
    }
}