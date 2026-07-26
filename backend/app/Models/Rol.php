<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo que representa un rol del sistema.
 *
 * @property int $id
 * @property string $nombre
 * @property string|null $descripcion
 * @property string $estado
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Rol extends Model
{
    /**
     * Nombre de la tabla asociada al modelo.
     *
     * @var string
     */
    protected $table = 'roles';

    /**
     * Atributos asignables masivamente.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nombre',
        'descripcion',
        'estado',
    ];

    /**
     * Conversión de atributos.
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

    /**
     * Permisos asignados al rol.
     */
    public function permisos(): BelongsToMany
    {
        return $this->belongsToMany(
            Permiso::class,
            'rol_permiso',
            'rol_id',
            'permiso_id'
        )->withTimestamps();
    }
    
    public function usuarios(): HasMany
    {
        return $this->hasMany(Usuario::class);
    }
}