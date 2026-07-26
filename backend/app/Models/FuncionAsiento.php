<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FuncionAsiento extends Model
{
    protected $table = 'funcion_asientos';

    protected $fillable = [
        'funcion_id',
        'asiento_id',
        'precio',
        'estado',
        'bloqueado_hasta',
    ];

    protected function casts(): array
    {
        return [
            'funcion_id' => 'integer',
            'asiento_id' => 'integer',
            'precio' => 'decimal:2',
            'bloqueado_hasta' => 'datetime',
        ];
    }

    public function funcion(): BelongsTo
    {
        return $this->belongsTo(Funcion::class, 'funcion_id');
    }

    public function asiento(): BelongsTo
    {
        return $this->belongsTo(Asiento::class, 'asiento_id');
    }

    public function reservaDetalles(): HasMany
    {
        return $this->hasMany(ReservaDetalle::class);
    }

    public function entradas(): HasMany
    {
        return $this->hasMany(Entrada::class);
    }
}