<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pago extends Model
{
    protected $table = 'pagos';

    protected $fillable = [
        'venta_id',
        'metodo_pago_id',
        'proveedor',
        'referencia_proveedor',
        'monto',
        'moneda',
        'estado',
        'autorizacion_codigo',
        'aprobado_en',
        'descripcion',
    ];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'venta_id' => 'integer',
            'metodo_pago_id' => 'integer',
            'monto' => 'decimal:2',
            'aprobado_en' => 'datetime',
        ];
    }

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'venta_id');
    }

    public function metodoPago(): BelongsTo
    {
        return $this->belongsTo(MetodoPago::class, 'metodo_pago_id');
    }
}