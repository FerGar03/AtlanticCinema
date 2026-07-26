<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservaDetalle extends Model
{
    use HasFactory;

    protected $table = 'reserva_detalles';

    protected $fillable = [
        'reserva_id',
        'funcion_asiento_id',
        'precio',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'reserva_id' => 'integer',
            'funcion_asiento_id' => 'integer',
            'precio' => 'decimal:2',
        ];
    }

    public function reserva(): BelongsTo
    {
        return $this->belongsTo(Reserva::class);
    }

    public function funcionAsiento(): BelongsTo
    {
        return $this->belongsTo(FuncionAsiento::class);
    }
}