<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePeliculaRequest;
use App\Http\Requests\UpdatePeliculaRequest;
use App\Models\Pelicula;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PeliculaController extends Controller
{
    /**
     * Lista las películas.
     *
     * Sin paginar=1 mantiene el comportamiento
     * anterior para Cartelera, Funciones y
     * cualquier otro consumidor del catálogo.
     *
     * Con paginar=1 habilita:
     * - búsqueda
     * - filtros
     * - paginación administrativa
     */
    public function index(
        Request $request
    ): JsonResponse {
        $datos = $request->validate([
            'buscar' => [
                'nullable',
                'string',
                'max:180',
            ],

            'estado' => [
                'nullable',
                'string',
                Rule::in([
                    'ACTIVA',
                    'INACTIVA',
                ]),
            ],

            'clasificacion_id' => [
                'nullable',
                'integer',
                Rule::exists(
                    'clasificaciones',
                    'id'
                ),
            ],

            'genero_id' => [
                'nullable',
                'integer',
                Rule::exists(
                    'generos',
                    'id'
                ),
            ],

            'paginar' => [
                'nullable',
                'boolean',
            ],

            'per_page' => [
                'nullable',
                'integer',
                Rule::in([
                    20,
                    50,
                    100,
                ]),
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $consulta =
            Pelicula::query()
                ->with([
                    'clasificacion',
                    'generos',
                ]);

        /*
         * Búsqueda general.
         *
         * Busca por:
         * - título
         * - título original
         * - sinopsis
         * - clasificación
         * - género
         */
        if (
            ! empty(
                $datos['buscar']
            )
        ) {
            $termino =
                trim(
                    $datos['buscar']
                );

            $consulta->where(
                function (
                    Builder $query
                ) use (
                    $termino
                ): void {
                    $query
                        ->where(
                            'titulo',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhere(
                            'titulo_original',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhere(
                            'sinopsis',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhereHas(
                            'clasificacion',
                            function (
                                Builder $clasificacion
                            ) use (
                                $termino
                            ): void {
                                $clasificacion->where(
                                    'nombre',
                                    'ilike',
                                    '%'
                                    . $termino
                                    . '%'
                                );
                            }
                        )

                        ->orWhereHas(
                            'generos',
                            function (
                                Builder $genero
                            ) use (
                                $termino
                            ): void {
                                $genero->where(
                                    'nombre',
                                    'ilike',
                                    '%'
                                    . $termino
                                    . '%'
                                );
                            }
                        );
                }
            );
        }

        /*
         * Filtro por estado.
         */
        if (
            ! empty(
                $datos['estado']
            )
        ) {
            $consulta->where(
                'estado',
                $datos['estado']
            );
        }

        /*
         * Filtro por clasificación.
         */
        if (
            ! empty(
                $datos['clasificacion_id']
            )
        ) {
            $consulta->where(
                'clasificacion_id',
                (int)
                $datos[
                    'clasificacion_id'
                ]
            );
        }

        /*
         * Filtro por género.
         */
        if (
            ! empty(
                $datos['genero_id']
            )
        ) {
            $generoId =
                (int)
                $datos['genero_id'];

            $consulta->whereHas(
                'generos',
                function (
                    Builder $genero
                ) use (
                    $generoId
                ): void {
                    $genero->where(
                        'generos.id',
                        $generoId
                    );
                }
            );
        }

        $consulta->orderBy(
            'titulo'
        );

        /*
         * Conserva la respuesta anterior
         * para otros consumidores.
         */
        if (
            ! $request->boolean(
                'paginar'
            )
        ) {
            $peliculas =
                $consulta->get();

            return response()->json([
                'data' =>
                    $peliculas,
            ]);
        }

        $porPagina =
            (int) (
                $datos['per_page']
                ?? 20
            );

        $peliculas =
            $consulta->paginate(
                $porPagina
            );

        return response()->json([
            'data' =>
                $peliculas->items(),

            'meta' => [
                'current_page' =>
                    $peliculas
                        ->currentPage(),

                'last_page' =>
                    $peliculas
                        ->lastPage(),

                'per_page' =>
                    $peliculas
                        ->perPage(),

                'total' =>
                    $peliculas
                        ->total(),

                'from' =>
                    $peliculas
                        ->firstItem(),

                'to' =>
                    $peliculas
                        ->lastItem(),
            ],
        ]);
    }

    public function store(
        StorePeliculaRequest $request
    ): JsonResponse {
        $datos =
            $request->validated();

        $generoIds =
            $datos['genero_ids']
            ?? [];

        unset(
            $datos['genero_ids']
        );

        $pelicula =
            DB::transaction(
                function () use (
                    $datos,
                    $generoIds
                ): Pelicula {
                    $pelicula =
                        Pelicula::create([
                            ...$datos,

                            'estado' =>
                                $datos['estado']
                                ?? 'ACTIVA',
                        ]);

                    if (
                        ! empty(
                            $generoIds
                        )
                    ) {
                        $pelicula
                            ->generos()
                            ->sync(
                                $generoIds
                            );
                    }

                    return $pelicula;
                }
            );

        $pelicula->load([
            'clasificacion',
            'generos',
        ]);

        return response()->json([
            'message' =>
                'Película registrada correctamente.',

            'data' =>
                $pelicula,
        ], 201);
    }

    public function show(
        Pelicula $pelicula
    ): JsonResponse {
        $pelicula->load([
            'clasificacion',
            'generos',
        ]);

        return response()->json([
            'data' =>
                $pelicula,
        ]);
    }

    public function update(
        UpdatePeliculaRequest $request,
        Pelicula $pelicula
    ): JsonResponse {
        $datos =
            $request->validated();

        $actualizarGeneros =
            array_key_exists(
                'genero_ids',
                $datos
            );

        $generoIds =
            $datos['genero_ids']
            ?? [];

        unset(
            $datos['genero_ids']
        );

        DB::transaction(
            function () use (
                $pelicula,
                $datos,
                $actualizarGeneros,
                $generoIds
            ): void {
                if (
                    ! empty(
                        $datos
                    )
                ) {
                    $pelicula->update(
                        $datos
                    );
                }

                if (
                    $actualizarGeneros
                ) {
                    $pelicula
                        ->generos()
                        ->sync(
                            $generoIds
                        );
                }
            }
        );

        $pelicula->refresh();

        $pelicula->load([
            'clasificacion',
            'generos',
        ]);

        return response()->json([
            'message' =>
                'Película actualizada correctamente.',

            'data' =>
                $pelicula,
        ]);
    }

    public function destroy(
        Pelicula $pelicula
    ): JsonResponse {
        if (
            $pelicula
                ->funciones()
                ->exists()
        ) {
            return response()->json([
                'message' =>
                    'La película no puede eliminarse porque tiene funciones asociadas. Puede marcarla como INACTIVA.',
            ], 422);
        }

        $pelicula->delete();

        return response()->json([
            'message' =>
                'Película eliminada correctamente.',
        ]);
    }
}