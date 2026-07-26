<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Funcion extends Model
{
    protected $table = 'funciones';

    protected $fillable = [
        'pelicula_id',
        'sala_id',
        'formato_id',
        'inicia_en',
        'finaliza_en',
        'precio_base',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'pelicula_id' => 'integer',
            'sala_id' => 'integer',
            'formato_id' => 'integer',
            'inicia_en' => 'datetime',
            'finaliza_en' => 'datetime',
            'precio_base' => 'decimal:2',
        ];
    }

    public function pelicula(): BelongsTo
    {
        return $this->belongsTo(Pelicula::class, 'pelicula_id');
    }

    public function sala(): BelongsTo
    {
        return $this->belongsTo(Sala::class, 'sala_id');
    }

    public function formato(): BelongsTo
    {
        return $this->belongsTo(Formato::class, 'formato_id');
    }

    public function asientos(): HasMany
    {
        return $this->hasMany(FuncionAsiento::class, 'funcion_id');
    }

    public function reservas(): HasMany
    {
        return $this->hasMany(Reserva::class);
    }

    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class);
    }
}