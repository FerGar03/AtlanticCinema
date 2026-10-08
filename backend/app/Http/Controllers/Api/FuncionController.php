<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFuncionRequest;
use App\Http\Requests\StoreFuncionesMultiplesRequest;
use App\Http\Requests\UpdateFuncionRequest;
use App\Models\Funcion;
use App\Services\FuncionService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class FuncionController extends Controller
{
    private const CACHE_CARTELERA = 'funciones:cartelera:publica';

    private const CACHE_SEGUNDOS = 30;

    public function __construct(
        private readonly FuncionService $funcionService
    ) {
    }

    /**
     * Lista las funciones.
     *
     * Sin paginar=1:
     * - cartelera;
     * - taquilla;
     * - compra web;
     * - otros consumidores públicos.
     *
     * En este caso solamente se devuelven funciones
     * que todavía no han finalizado y que no están
     * canceladas.
     *
     * Con paginar=1:
     * - administración;
     * - búsqueda;
     * - filtros;
     * - conteos;
     * - paginación.
     */
    public function index(
        Request $request
    ): JsonResponse {
        $datos = $request->validate([
            'buscar' => [
                'nullable',
                'string',
                'max:150',
            ],

            'estado' => [
                'nullable',
                'string',
                Rule::in([
                    'PROGRAMADA',
                    'ACTIVA',
                    'FINALIZADA',
                    'CANCELADA',
                ]),
            ],

            'sala_id' => [
                'nullable',
                'integer',
                Rule::exists(
                    'salas',
                    'id'
                ),
            ],

            'formato_id' => [
                'nullable',
                'integer',
                Rule::exists(
                    'formatos',
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

        $paginar = $request->boolean(
            'paginar'
        );

        /*
         * El listado público más común:
         *
         * GET /api/funciones
         *
         * se almacena brevemente en caché.
         *
         * No se utilizan conteos administrativos
         * porque la cartelera no los necesita.
         */
        if (
            ! $paginar
            && empty($datos['buscar'])
            && empty($datos['estado'])
            && empty($datos['sala_id'])
            && empty($datos['formato_id'])
        ) {
            $funciones = Cache::remember(
                self::CACHE_CARTELERA,
                now()->addSeconds(
                    self::CACHE_SEGUNDOS
                ),
                function () {
                    return Funcion::query()
                        ->with([
                            'pelicula',
                            'sala',
                            'formato',
                        ])
                        ->where(
                            'finaliza_en',
                            '>=',
                            now()
                        )
                        ->where(
                            'estado',
                            '!=',
                            'CANCELADA'
                        )
                        ->orderBy(
                            'inicia_en'
                        )
                        ->get();
                }
            );

            return response()->json([
                'message' =>
                    'Funciones obtenidas correctamente.',

                'data' =>
                    $funciones,
            ]);
        }

        /*
         * Construcción de la consulta.
         */
        $consulta =
            Funcion::query()
                ->with([
                    'pelicula',
                    'sala',
                    'formato',
                ]);

        /*
         * Los conteos de reservas y ventas
         * solamente se necesitan en el módulo
         * administrativo.
         */
        if ($paginar) {
            $consulta->withCount([
                'reservas',
                'ventas',
            ]);
        } else {
            /*
             * Los consumidores públicos solamente
             * necesitan funciones vigentes.
             */
            $consulta
                ->where(
                    'finaliza_en',
                    '>=',
                    now()
                )
                ->where(
                    'estado',
                    '!=',
                    'CANCELADA'
                );
        }

        /*
         * Búsqueda por película,
         * sala o formato.
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
                        ->whereHas(
                            'pelicula',
                            function (
                                Builder $pelicula
                            ) use (
                                $termino
                            ): void {
                                $pelicula->where(
                                    'titulo',
                                    'ilike',
                                    '%'
                                    . $termino
                                    . '%'
                                );
                            }
                        )

                        ->orWhereHas(
                            'sala',
                            function (
                                Builder $sala
                            ) use (
                                $termino
                            ): void {
                                $sala->where(
                                    'nombre',
                                    'ilike',
                                    '%'
                                    . $termino
                                    . '%'
                                );
                            }
                        )

                        ->orWhereHas(
                            'formato',
                            function (
                                Builder $formato
                            ) use (
                                $termino
                            ): void {
                                $formato->where(
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

        if (
            ! empty(
                $datos['sala_id']
            )
        ) {
            $consulta->where(
                'sala_id',
                (int) $datos['sala_id']
            );
        }

        if (
            ! empty(
                $datos['formato_id']
            )
        ) {
            $consulta->where(
                'formato_id',
                (int) $datos['formato_id']
            );
        }

        $consulta->orderBy(
            'inicia_en'
        );

        /*
         * Listado público filtrado,
         * pero sin paginación.
         */
        if (! $paginar) {
            $funciones =
                $consulta->get();

            return response()->json([
                'message' =>
                    'Funciones obtenidas correctamente.',

                'data' =>
                    $funciones,
            ]);
        }

        /*
         * Listado administrativo paginado.
         */
        $porPagina =
            (int) (
                $datos['per_page']
                ?? 20
            );

        $funciones =
            $consulta->paginate(
                $porPagina
            );

        return response()->json([
            'message' =>
                'Funciones obtenidas correctamente.',

            'data' =>
                $funciones->items(),

            'meta' => [
                'current_page' =>
                    $funciones
                        ->currentPage(),

                'last_page' =>
                    $funciones
                        ->lastPage(),

                'per_page' =>
                    $funciones
                        ->perPage(),

                'total' =>
                    $funciones
                        ->total(),

                'from' =>
                    $funciones
                        ->firstItem(),

                'to' =>
                    $funciones
                        ->lastItem(),
            ],
        ]);
    }

    public function store(
        StoreFuncionRequest $request
    ): JsonResponse {
        $funcion =
            $this
                ->funcionService
                ->crear(
                    $request->validated()
                );

        $this->limpiarCacheCartelera();

        return response()->json([
            'message' =>
                'Función creada correctamente.',

            'data' =>
                $funcion,
        ], 201);
    }

    /**
     * Programa varias funciones siguiendo
     * un rango de fechas y días de semana.
     */
    public function storeMultiples(
        StoreFuncionesMultiplesRequest $request
    ): JsonResponse {
        $funciones =
            $this
                ->funcionService
                ->crearMultiples(
                    $request->validated()
                );

        $this->limpiarCacheCartelera();

        return response()->json([
            'message' =>
                $funciones->count() === 1
                    ? '1 función fue programada correctamente.'
                    : $funciones->count()
                        . ' funciones fueron programadas correctamente.',

            'cantidad' =>
                $funciones->count(),

            'data' =>
                $funciones,
        ], 201);
    }

    public function show(
        Funcion $funcion
    ): JsonResponse {
        $funcion->load([
            'pelicula',
            'sala',
            'formato',
            'asientos.asiento',
        ]);

        $funcion->loadCount([
            'reservas',
            'ventas',
        ]);

        return response()->json([
            'message' =>
                'Función obtenida correctamente.',

            'data' =>
                $funcion,
        ]);
    }

    public function update(
        UpdateFuncionRequest $request,
        Funcion $funcion
    ): JsonResponse {
        $funcion =
            $this
                ->funcionService
                ->actualizar(
                    $funcion,
                    $request->validated()
                );

        $this->limpiarCacheCartelera();

        return response()->json([
            'message' =>
                'Función actualizada correctamente.',

            'data' =>
                $funcion,
        ]);
    }

    public function cancelar(
        Funcion $funcion
    ): JsonResponse {
        $funcion =
            $this
                ->funcionService
                ->cancelar(
                    $funcion
                );

        $this->limpiarCacheCartelera();

        return response()->json([
            'message' =>
                'Función cancelada correctamente.',

            'data' =>
                $funcion,
        ]);
    }

    /**
     * Elimina la copia temporal de la cartelera
     * después de cualquier modificación.
     */
    private function limpiarCacheCartelera(): void
    {
        Cache::forget(
            self::CACHE_CARTELERA
        );
    }
}