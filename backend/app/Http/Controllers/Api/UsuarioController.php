<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUsuarioAdminRequest;
use App\Http\Requests\UpdateUsuarioAdminRequest;
use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UsuarioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $buscar = trim(
            (string) $request->query('buscar', '')
        );

        $usuarios = Usuario::query()
            ->with('rol')
            ->when(
                $buscar !== '',
                function ($query) use ($buscar) {
                    $query->where(
                        function ($subquery) use ($buscar) {
                            $subquery
                                ->where(
                                    'nombres',
                                    'ilike',
                                    "%{$buscar}%"
                                )
                                ->orWhere(
                                    'apellidos',
                                    'ilike',
                                    "%{$buscar}%"
                                )
                                ->orWhere(
                                    'correo',
                                    'ilike',
                                    "%{$buscar}%"
                                );
                        }
                    );
                }
            )
            ->orderBy('nombres')
            ->orderBy('apellidos')
            ->get();

        return response()->json([
            'message' =>
                'Usuarios obtenidos correctamente.',
            'data' => $usuarios,
        ]);
    }

    public function store(
        StoreUsuarioAdminRequest $request
    ): JsonResponse {
        $datos = $request->validated();

        unset(
            $datos['password_confirmation']
        );

        $usuario = Usuario::query()
            ->create($datos);

        $usuario->load('rol');

        return response()->json([
            'message' =>
                'Usuario creado correctamente.',
            'data' => $usuario,
        ], 201);
    }

    public function show(
        Usuario $usuario
    ): JsonResponse {
        $usuario->load('rol');

        return response()->json([
            'message' =>
                'Usuario obtenido correctamente.',
            'data' => $usuario,
        ]);
    }

    public function update(
        UpdateUsuarioAdminRequest $request,
        Usuario $usuario
    ): JsonResponse {
        $datos = $request->validated();

        unset(
            $datos['password_confirmation']
        );

        if (
            array_key_exists(
                'password',
                $datos
            )
            && empty($datos['password'])
        ) {
            unset($datos['password']);
        }

        $usuarioAutenticado =
            $request->user();

        if (
            $usuarioAutenticado->id
            === $usuario->id
        ) {
            $this->validarAutoadministracion(
                usuario: $usuario,
                datos: $datos,
            );
        }

        $usuario->update($datos);

        $usuario->refresh();
        $usuario->load('rol');

        return response()->json([
            'message' =>
                'Usuario actualizado correctamente.',
            'data' => $usuario,
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

        $usuario->tokens()->delete();
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
            isset($datos['estado'])
            && $datos['estado'] !== 'ACTIVO'
        ) {
            throw ValidationException::withMessages([
                'estado' =>
                    'No puede desactivar o bloquear su propia cuenta.',
            ]);
        }

        if (
            isset($datos['rol_id'])
            && (int) $datos['rol_id']
                !== (int) $usuario->rol_id
        ) {
            $rolActual = Rol::query()
                ->find($usuario->rol_id);

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