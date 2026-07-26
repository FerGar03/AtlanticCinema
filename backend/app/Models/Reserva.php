<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Reserva extends Model
{
    use HasFactory;

    protected $table = 'reservas';

    protected $fillable = [
        'codigo',
        'usuario_id',
        'funcion_id',
        'cantidad_entradas',
        'subtotal',
        'descuento',
        'total',
        'estado',
        'reservada_en',
        'expira_en',
        'convertida_en',
        'cancelada_en',
        'motivo_cancelacion',
    ];

    protected function casts(): array
    {
        return [
            'usuario_id' => 'integer',
            'funcion_id' => 'integer',
            'cantidad_entradas' => 'integer',
            'subtotal' => 'decimal:2',
            'descuento' => 'decimal:2',
            'total' => 'decimal:2',
            'reservada_en' => 'datetime',
            'expira_en' => 'datetime',
            'convertida_en' => 'datetime',
            'cancelada_en' => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class);
    }

    public function funcion(): BelongsTo
    {
        return $this->belongsTo(Funcion::class);
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(ReservaDetalle::class);
    }

    public function venta(): HasOne
    {
        return $this->hasOne(Venta::class);
    }
}