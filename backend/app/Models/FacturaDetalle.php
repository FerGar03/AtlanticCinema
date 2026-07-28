<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FacturaDetalle extends Model
{
    protected $table = 'factura_detalles';

    protected $fillable = [
        'factura_id',
        'entrada_id',
        'numero_linea',
        'descripcion',
        'cantidad',
        'precio_unitario',
        'descuento',
        'subtotal',
        'monto_impuesto',
        'total_linea',
    ];

    protected function casts(): array
    {
        return [
            'factura_id' => 'integer',
            'entrada_id' => 'integer',
            'numero_linea' => 'integer',
            'cantidad' => 'integer',
            'precio_unitario' => 'decimal:2',
            'descuento' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'monto_impuesto' => 'decimal:2',
            'total_linea' => 'decimal:2',
        ];
    }

    public function factura(): BelongsTo
    {
        return $this->belongsTo(Factura::class);
    }

    public function entrada(): BelongsTo
    {
        return $this->belongsTo(Entrada::class);
    }
}