<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Entrada extends Model
{
    protected $table = 'entradas';

    protected $fillable = [
        'venta_id',
        'funcion_asiento_id',
        'codigo',
        'precio',
        'estado',
        'emitida_en',
        'utilizada_en',
        'cancelada_en',
        'reembolsada_en',
    ];

    protected function casts(): array
    {
        return [
            'venta_id' => 'integer',
            'funcion_asiento_id' => 'integer',
            'precio' => 'decimal:2',
            'emitida_en' => 'datetime',
            'utilizada_en' => 'datetime',
            'cancelada_en' => 'datetime',
            'reembolsada_en' => 'datetime',
        ];
    }

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class);
    }

    public function funcionAsiento(): BelongsTo
    {
        return $this->belongsTo(FuncionAsiento::class);
    }

    public function facturaDetalle(): HasOne
    {
        return $this->hasOne(FacturaDetalle::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}