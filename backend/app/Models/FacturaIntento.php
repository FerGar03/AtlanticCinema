<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacturaIntento extends Model
{
    protected $table = 'factura_intentos';

    protected $fillable = [
        'factura_id',
        'numero_intento',
        'operacion',
        'estado',
        'idempotency_key',
        'codigo_respuesta',
        'mensaje_respuesta',
        'solicitud',
        'respuesta',
        'procesado_en',
    ];

    protected function casts(): array
    {
        return [
            'factura_id' => 'integer',
            'numero_intento' => 'integer',
            'solicitud' => 'array',
            'respuesta' => 'array',
            'procesado_en' => 'datetime',
        ];
    }

    public function factura(): BelongsTo
    {
        return $this->belongsTo(Factura::class);
    }
}