<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSalaRequest;
use App\Http\Requests\UpdateSalaRequest;
use App\Models\Sala;
use App\Services\SalaService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SalaController extends Controller
{
    public function __construct(
        private readonly SalaService $salaService
    ) {
    }

    /**
     * Lista las salas.
     *
     * Sin paginar=1 conserva el comportamiento
     * anterior para los demás módulos.
     *
     * Con paginar=1 habilita:
     * - búsqueda
     * - filtro por estado
     * - paginación administrativa
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
                    'ACTIVA',
                    'INACTIVA',
                    'MANTENIMIENTO',
                ]),
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
            Sala::query()
                ->withCount([
                    'asientos' =>
                        fn ($query) =>
                            $query->where(
                                'estado',
                                'ACTIVO'
                            ),
                ]);

        /*
         * Búsqueda por:
         * - nombre
         * - descripción
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
                            'nombre',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhere(
                            'descripcion',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
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

        $consulta->orderBy(
            'nombre'
        );

        /*
         * Compatibilidad con los demás
         * consumidores de /salas.
         */
        if (
            ! $request->boolean(
                'paginar'
            )
        ) {
            $salas =
                $consulta->get();

            return response()->json([
                'message' =>
                    'Salas obtenidas correctamente.',

                'data' =>
                    $salas,
            ]);
        }

        $porPagina =
            (int) (
                $datos['per_page']
                ?? 20
            );

        $salas =
            $consulta->paginate(
                $porPagina
            );

        return response()->json([
            'message' =>
                'Salas obtenidas correctamente.',

            'data' =>
                $salas->items(),

            'meta' => [
                'current_page' =>
                    $salas
                        ->currentPage(),

                'last_page' =>
                    $salas
                        ->lastPage(),

                'per_page' =>
                    $salas
                        ->perPage(),

                'total' =>
                    $salas
                        ->total(),

                'from' =>
                    $salas
                        ->firstItem(),

                'to' =>
                    $salas
                        ->lastItem(),
            ],
        ]);
    }

    /**
     * Crea una nueva sala junto con
     * su distribución de asientos.
     */
    public function store(
        StoreSalaRequest $request
    ): JsonResponse {
        $sala =
            $this
                ->salaService
                ->crear(
                    $request->validated()
                );

        return response()->json([
            'message' =>
                'Sala y distribución de asientos creadas correctamente.',

            'data' =>
                $sala,
        ], 201);
    }

    public function show(
        Sala $sala
    ): JsonResponse {
        $sala->load([
            'asientos' =>
                fn ($query) =>
                    $query
                        ->orderBy(
                            'fila'
                        )
                        ->orderBy(
                            'numero'
                        ),
        ]);

        $sala->loadCount([
            'asientos' =>
                fn ($query) =>
                    $query->where(
                        'estado',
                        'ACTIVO'
                    ),
        ]);

        return response()->json([
            'message' =>
                'Sala obtenida correctamente.',

            'data' =>
                $sala,
        ]);
    }

    public function update(
        UpdateSalaRequest $request,
        Sala $sala
    ): JsonResponse {
        $sala->update(
            $request->validated()
        );

        $sala->refresh();

        $sala->loadCount([
            'asientos' =>
                fn ($query) =>
                    $query->where(
                        'estado',
                        'ACTIVO'
                    ),
        ]);

        return response()->json([
            'message' =>
                'Sala actualizada correctamente.',

            'data' =>
                $sala,
        ]);
    }
}