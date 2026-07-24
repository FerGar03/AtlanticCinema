<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo que representa una película.
 *
 * @property int $id
 * @property int $clasificacion_id
 * @property string $titulo
 * @property string|null $titulo_original
 * @property string $sinopsis
 * @property int $duracion_minutos
 * @property string|null $fecha_estreno
 * @property string $imagen_url
 * @property string|null $trailer_url
 * @property string $estado
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 */
class Pelicula extends Model
{
    use SoftDeletes;

    /**
     * Nombre de la tabla asociada al modelo.
     *
     * @var string
     */
    protected $table = 'peliculas';

    /**
     * Atributos asignables masivamente.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'clasificacion_id',
        'titulo',
        'titulo_original',
        'sinopsis',
        'duracion_minutos',
        'fecha_estreno',
        'imagen_url',
        'trailer_url',
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
            'duracion_minutos' => 'integer',
            'fecha_estreno' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Clasificación de la película.
     */
    public function clasificacion(): BelongsTo
    {
        return $this->belongsTo(Clasificacion::class);
    }

    /**
     * Géneros asociados a la película.
     */
    public function generos(): BelongsToMany
    {
        return $this->belongsToMany(
            Genero::class,
            'pelicula_genero',
            'pelicula_id',
            'genero_id'
        )->withTimestamps();
    }

    public function funciones(): HasMany
    {
        return $this->hasMany(Funcion::class, 'pelicula_id');
    }
}