<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Venta extends Model
{
    protected $table = 'ventas';

    protected $fillable = [
        'numero_venta',
        'cliente_id',
        'empleado_id',
        'reserva_id',
        'funcion_id',
        'origen',
        'subtotal',
        'descuento',
        'total',
        'estado',
        'realizada_en',
        'pagada_en',
        'cancelada_en',
        'motivo_cancelacion',
    ];

    protected function casts(): array
    {
        return [
            'cliente_id' => 'integer',
            'empleado_id' => 'integer',
            'reserva_id' => 'integer',
            'funcion_id' => 'integer',
            'subtotal' => 'decimal:2',
            'descuento' => 'decimal:2',
            'total' => 'decimal:2',
            'realizada_en' => 'datetime',
            'pagada_en' => 'datetime',
            'cancelada_en' => 'datetime',
        ];
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'cliente_id');
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'empleado_id');
    }

    public function reserva(): BelongsTo
    {
        return $this->belongsTo(Reserva::class);
    }

    public function funcion(): BelongsTo
    {
        return $this->belongsTo(Funcion::class);
    }

    public function entradas(): HasMany
    {
        return $this->hasMany(Entrada::class);
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class, 'venta_id');
    }

    public function factura(): HasOne
    {
        return $this->hasOne(Factura::class);
    }
}