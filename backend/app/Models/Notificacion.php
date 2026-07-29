<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notificacion extends Model
{
    protected $table = 'notificaciones';
    
    protected $fillable = [
        'usuario_id',
        'venta_id',
        'reserva_id',
        'factura_id',
        'ticket_id',
        'canal',
        'destinatario',
        'asunto',
        'mensaje',
        'estado',
        'enviada_en',
        'leida_en',
    ];

    protected function casts(): array
    {
        return [
            'usuario_id' => 'integer',
            'venta_id' => 'integer',
            'reserva_id' => 'integer',
            'factura_id' => 'integer',
            'ticket_id' => 'integer',
            'enviada_en' => 'datetime',
            'leida_en' => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class);
    }

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class);
    }

    public function reserva(): BelongsTo
    {
        return $this->belongsTo(Reserva::class);
    }

    public function factura(): BelongsTo
    {
        return $this->belongsTo(Factura::class);
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }
}