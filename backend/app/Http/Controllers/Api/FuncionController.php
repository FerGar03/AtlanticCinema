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
use Illuminate\Validation\Rule;

class FuncionController extends Controller
{
    public function __construct(
        private readonly FuncionService $funcionService
    ) {
    }

    /**
     * Lista las funciones.
     *
     * Sin paginar=1 mantiene el comportamiento
     * anterior para:
     * - cartelera
     * - taquilla
     * - compra web
     * - otros consumidores públicos
     *
     * Con paginar=1 habilita:
     * - búsqueda
     * - filtros administrativos
     * - paginación
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

        $consulta =
            Funcion::query()
                ->with([
                    'pelicula',
                    'sala',
                    'formato',
                ])
                ->withCount([
                    'reservas',
                    'ventas',
                ]);

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
                (int)
                $datos['sala_id']
            );
        }

        if (
            ! empty(
                $datos['formato_id']
            )
        ) {
            $consulta->where(
                'formato_id',
                (int)
                $datos['formato_id']
            );
        }

        /*
         * Conservamos el orden que ya
         * utilizaba el módulo.
         */
        $consulta->orderBy(
            'inicia_en'
        );

        /*
         * Sin paginar=1 devolvemos
         * nuevamente el arreglo completo.
         *
         * Esto es importante para no romper
         * Cartelera ni Taquilla.
         */
        if (
            ! $request->boolean(
                'paginar'
            )
        ) {
            $funciones =
                $consulta->get();

            return response()->json([
                'message' =>
                    'Funciones obtenidas correctamente.',

                'data' =>
                    $funciones,
            ]);
        }

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

        return response()->json([
            'message' =>
                'Función cancelada correctamente.',

            'data' =>
                $funcion,
        ]);
    }
}