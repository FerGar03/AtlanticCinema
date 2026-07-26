<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens;
    use HasFactory;
    use Notifiable;
    use SoftDeletes;

    protected $table = 'usuarios';

    protected $fillable = [
        'rol_id',
        'nombres',
        'apellidos',
        'correo',
        'password',
        'telefono',
        'nit',
        'direccion',
        'correo_verificado_en',
        'estado',
        'ultimo_acceso_en',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'rol_id' => 'integer',
            'correo_verificado_en' => 'datetime',
            'ultimo_acceso_en' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function rol(): BelongsTo
    {
        return $this->belongsTo(Rol::class);
    }

    public function reservas(): HasMany
    {
        return $this->hasMany(Reserva::class);
    }
}