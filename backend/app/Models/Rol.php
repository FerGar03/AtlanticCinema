<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo que representa los roles del sistema.
 *
 * @property int $id
 * @property string $nombre
 * @property string|null $descripcion
 * @property string $estado
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */

class Rol extends Model
{
    /**
     * Tabla asociada al modelo.
     *
     * Se especifica explícitamente porque Laravel podría convertir
     * "Rol" en "rols", mientras que nuestra tabla se llama "roles".
     */
    protected $table = 'roles';

    /**
     * Atributos que pueden asignarse masivamente.
     *
     * @var list<string>
     */
    protected $fillable = [
        'nombre',
        'descripcion',
        'estado',
    ];

    /**
     * Conversión de tipos de los atributos.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}