<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Factura extends Model
{
    protected $fillable = [
        'venta_id',
        'numero_interno',
        'tipo_documento',
        'serie',
        'numero_documento',
        'uuid',
        'nit_receptor',
        'nombre_receptor',
        'subtotal',
        'descuento',
        'impuestos',
        'total',
        'estado',
        'certificada_en',
    ];

    protected function casts(): array
    {
        return [
            'venta_id' => 'integer',
            'subtotal' => 'decimal:2',
            'descuento' => 'decimal:2',
            'impuestos' => 'decimal:2',
            'total' => 'decimal:2',
            'certificada_en' => 'datetime',
        ];
    }

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class);
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(FacturaDetalle::class);
    }

    public function intentos(): HasMany
    {
        return $this->hasMany(FacturaIntento::class);
    }
}