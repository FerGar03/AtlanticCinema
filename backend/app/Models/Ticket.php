<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    protected $fillable = [
        'entrada_id',
        'codigo',
        'token_validacion',
        'formato',
        'estado',
        'pdf_url',
        'qr_url',
        'generado_en',
        'utilizado_en',
        'cancelado_en',
        'invalidado_en',
        'motivo_invalidacion',
        'version',
    ];

    protected function casts(): array
    {
        return [
            'entrada_id' => 'integer',
            'generado_en' => 'datetime',
            'utilizado_en' => 'datetime',
            'cancelado_en' => 'datetime',
            'invalidado_en' => 'datetime',
            'version' => 'integer',
        ];
    }

    public function entrada(): BelongsTo
    {
        return $this->belongsTo(Entrada::class);
    }

    public function notificaciones(): HasMany
    {
        return $this->hasMany(Notificacion::class);
    }
}