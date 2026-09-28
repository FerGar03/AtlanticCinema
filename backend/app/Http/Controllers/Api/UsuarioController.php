<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUsuarioAdminRequest;
use App\Http\Requests\UpdateUsuarioAdminRequest;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UsuarioController extends Controller
{
    /**
     * Lista usuarios.
     *
     * Sin paginar=1 conserva el comportamiento
     * anterior para cualquier otro consumidor.
     *
     * Con paginar=1 habilita:
     * - búsqueda
     * - filtro por rol
     * - filtro por estado
     * - filtro por origen
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

            'rol_id' => [
                'nullable',
                'integer',
                Rule::exists(
                    'roles',
                    'id'
                ),
            ],

            'estado' => [
                'nullable',
                'string',
                Rule::in([
                    'ACTIVO',
                    'INACTIVO',
                    'BLOQUEADO',
                ]),
            ],

            'origen' => [
                'nullable',
                'string',
                Rule::in([
                    'CORREO',
                    'GOOGLE',
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
            Usuario::query()
                ->with('rol');

        /*
         * Búsqueda general.
         *
         * Busca por:
         * - nombres
         * - apellidos
         * - correo
         * - teléfono
         * - NIT
         * - rol
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
                            'nombres',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhere(
                            'apellidos',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhere(
                            'correo',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhere(
                            'telefono',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhere(
                            'nit',
                            'ilike',
                            '%'
                            . $termino
                            . '%'
                        )

                        ->orWhereHas(
                            'rol',
                            function (
                                Builder $rol
                            ) use (
                                $termino
                            ): void {
                                $rol->where(
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
         * Filtro por rol.
         */
        if (
            ! empty(
                $datos['rol_id']
            )
        ) {
            $consulta->where(
                'rol_id',
                (int)
                $datos['rol_id']
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
         * Filtro por origen de autenticación.
         *
         * GOOGLE:
         * usuario asociado con google_id.
         *
         * CORREO:
         * usuario sin google_id.
         */
        if (
            ! empty(
                $datos['origen']
            )
        ) {
            if (
                $datos['origen']
                === 'GOOGLE'
            ) {
                $consulta->whereNotNull(
                    'google_id'
                );
            } else {
                $consulta->whereNull(
                    'google_id'
                );
            }
        }

        $consulta
            ->orderBy('nombres')
            ->orderBy('apellidos')
            ->orderBy('id');

        /*
         * Compatibilidad con el comportamiento
         * anterior.
         */
        if (
            ! $request->boolean(
                'paginar'
            )
        ) {
            $usuarios =
                $consulta->get();

            return response()->json([
                'message' =>
                    'Usuarios obtenidos correctamente.',

                'data' =>
                    $usuarios,
            ]);
        }

        $porPagina =
            (int) (
                $datos['per_page']
                ?? 20
            );

        $usuarios =
            $consulta->paginate(
                $porPagina
            );

        return response()->json([
            'message' =>
                'Usuarios obtenidos correctamente.',

            'data' =>
                $usuarios->items(),

            'meta' => [
                'current_page' =>
                    $usuarios
                        ->currentPage(),

                'last_page' =>
                    $usuarios
                        ->lastPage(),

                'per_page' =>
                    $usuarios
                        ->perPage(),

                'total' =>
                    $usuarios
                        ->total(),

                'from' =>
                    $usuarios
                        ->firstItem(),

                'to' =>
                    $usuarios
                        ->lastItem(),
            ],
        ]);
    }

    public function store(
        StoreUsuarioAdminRequest $request
    ): JsonResponse {
        $datos =
            $request->validated();

        unset(
            $datos[
                'password_confirmation'
            ]
        );

        $usuario =
            Usuario::query()
                ->create(
                    $datos
                );

        $usuario->load(
            'rol'
        );

        return response()->json([
            'message' =>
                'Usuario creado correctamente.',

            'data' =>
                $usuario,
        ], 201);
    }

    public function show(
        Usuario $usuario
    ): JsonResponse {
        $usuario->load(
            'rol'
        );

        return response()->json([
            'message' =>
                'Usuario obtenido correctamente.',

            'data' =>
                $usuario,
        ]);
    }

    public function update(
        UpdateUsuarioAdminRequest $request,
        Usuario $usuario
    ): JsonResponse {
        $datos =
            $request->validated();

        unset(
            $datos[
                'password_confirmation'
            ]
        );

        if (
            array_key_exists(
                'password',
                $datos
            )
            && empty(
                $datos['password']
            )
        ) {
            unset(
                $datos['password']
            );
        }

        $usuarioAutenticado =
            $request->user();

        if (
            $usuarioAutenticado->id
            === $usuario->id
        ) {
            $this
                ->validarAutoadministracion(
                    usuario:
                        $usuario,

                    datos:
                        $datos,
                );
        }

        $usuario->update(
            $datos
        );

        $usuario->refresh();

        $usuario->load(
            'rol'
        );

        return response()->json([
            'message' =>
                'Usuario actualizado correctamente.',

            'data' =>
                $usuario,
        ]);
    }

    public function destroy(
        Request $request,
        Usuario $usuario
    ): JsonResponse {
        if (
            $request->user()->id
            === $usuario->id
        ) {
            throw ValidationException::withMessages([
                'usuario' =>
                    'No puede eliminar su propia cuenta administrativa.',
            ]);
        }

        $usuario
            ->tokens()
            ->delete();

        $usuario->delete();

        return response()->json([
            'message' =>
                'Usuario eliminado correctamente.',
        ]);
    }

    private function validarAutoadministracion(
        Usuario $usuario,
        array $datos
    ): void {
        if (
            isset(
                $datos['estado']
            )
            && $datos['estado']
                !== 'ACTIVO'
        ) {
            throw ValidationException::withMessages([
                'estado' =>
                    'No puede desactivar o bloquear su propia cuenta.',
            ]);
        }

        if (
            isset(
                $datos['rol_id']
            )
            && (int)
                $datos['rol_id']
                !== (int)
                $usuario->rol_id
        ) {
            $rolActual =
                Rol::query()
                    ->find(
                        $usuario->rol_id
                    );

            if (
                $rolActual?->nombre
                === 'Administrador'
            ) {
                throw ValidationException::withMessages([
                    'rol_id' =>
                        'No puede cambiar su propio rol Administrador.',
                ]);
            }
        }
    }
}