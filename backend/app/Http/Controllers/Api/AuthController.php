<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegistrarUsuarioRequest;
use App\Models\Usuario;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService
    ) {
    }

    public function registrar(
        RegistrarUsuarioRequest $request
    ): JsonResponse {
        $resultado = $this->authService->registrar(
            $request->validated()
        );

        return response()->json([
            'message' => 'Usuario registrado correctamente.',
            'data' => [
                'usuario' => $resultado['usuario'],
                'token' => $resultado['token'],
                'tipo_token' => 'Bearer',
            ],
        ], Response::HTTP_CREATED);
    }

    public function iniciarSesion(
        LoginRequest $request
    ): JsonResponse {
        $resultado = $this->authService->iniciarSesion(
            $request->validated()
        );

        return response()->json([
            'message' => 'Sesión iniciada correctamente.',
            'data' => [
                'usuario' => $resultado['usuario'],
                'token' => $resultado['token'],
                'tipo_token' => 'Bearer',
            ],
        ]);
    }

    public function usuarioAutenticado(
        Request $request
    ): JsonResponse {
        $usuario = $request->user();

        if (! $usuario instanceof Usuario) {
            return response()->json([
                'message' => 'Usuario no autenticado.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $usuario->load('rol');

        return response()->json([
            'message' =>
                'Usuario autenticado obtenido correctamente.',

            'data' => $usuario,
        ]);
    }

    public function actualizarPerfil(
        Request $request
    ): JsonResponse {
        $usuario = $request->user();

        if (! $usuario instanceof Usuario) {
            return response()->json([
                'message' => 'Usuario no autenticado.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $datos = $request->validate([
            'nombres' => [
                'required',
                'string',
                'max:100',
            ],

            'apellidos' => [
                'required',
                'string',
                'max:100',
            ],

            'telefono' => [
                'nullable',
                'string',
                'max:30',
            ],

            'nit' => [
                'nullable',
                'string',
                'max:30',
                Rule::unique(
                    'usuarios',
                    'nit'
                )->ignore(
                    $usuario->id
                ),
            ],

            'direccion' => [
                'nullable',
                'string',
                'max:255',
            ],
        ], [
            'nombres.required' =>
                'Los nombres son obligatorios.',

            'apellidos.required' =>
                'Los apellidos son obligatorios.',

            'nit.unique' =>
                'El NIT ingresado ya está asociado a otro usuario.',
        ]);

        $usuario->update([
            'nombres' =>
                trim($datos['nombres']),

            'apellidos' =>
                trim($datos['apellidos']),

            'telefono' =>
                $this->normalizarDatoOpcional(
                    $datos['telefono'] ?? null
                ),

            'nit' =>
                $this->normalizarDatoOpcional(
                    $datos['nit'] ?? null
                ),

            'direccion' =>
                $this->normalizarDatoOpcional(
                    $datos['direccion'] ?? null
                ),
        ]);

        $usuario->refresh();
        $usuario->load('rol');

        return response()->json([
            'message' =>
                'Perfil actualizado correctamente.',

            'data' => $usuario,
        ]);
    }

    public function actualizarAvatar(
        Request $request
    ): JsonResponse {
        $usuario = $request->user();

        if (! $usuario instanceof Usuario) {
            return response()->json([
                'message' => 'Usuario no autenticado.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $request->validate([
            'avatar' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ], [
            'avatar.required' =>
                'Selecciona una imagen.',

            'avatar.image' =>
                'El archivo seleccionado debe ser una imagen.',

            'avatar.mimes' =>
                'La imagen debe ser JPG, JPEG, PNG o WEBP.',

            'avatar.max' =>
                'La imagen no puede superar los 2 MB.',
        ]);

        /*
         * Eliminamos únicamente avatares locales anteriores.
         * Nunca intentamos eliminar la URL proporcionada por Google.
         */
        $avatarAnterior =
            $usuario->avatar_url;

        if (
            $avatarAnterior
            && str_starts_with(
                $avatarAnterior,
                'avatars/'
            )
        ) {
            Storage::disk('public')
                ->delete(
                    $avatarAnterior
                );
        }

        $ruta =
            $request
                ->file('avatar')
                ->store(
                    'avatars',
                    'public'
                );

        $usuario->update([
            'avatar_url' => $ruta,
        ]);

        $usuario->refresh();
        $usuario->load('rol');

        return response()->json([
            'message' =>
                'Foto de perfil actualizada correctamente.',

            'data' => $usuario,
        ]);
    }

    public function cambiarPassword(
        Request $request
    ): JsonResponse {
        $usuario = $request->user();

        if (! $usuario instanceof Usuario) {
            return response()->json([
                'message' => 'Usuario no autenticado.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (
            $usuario->google_id
            && ! $usuario->password
        ) {
            return response()->json([
                'message' =>
                    'Esta cuenta utiliza autenticación con Google y no tiene una contraseña local.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $datos = $request->validate([
            'password_actual' => [
                'required',
                'string',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        if (
            ! Hash::check(
                $datos['password_actual'],
                $usuario->password
            )
        ) {
            return response()->json([
                'message' =>
                    'La contraseña actual no es correcta.',

                'errors' => [
                    'password_actual' => [
                        'La contraseña actual no es correcta.',
                    ],
                ],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (
            Hash::check(
                $datos['password'],
                $usuario->password
            )
        ) {
            return response()->json([
                'message' =>
                    'La nueva contraseña debe ser diferente de la contraseña actual.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $usuario->update([
            'password' =>
                $datos['password'],
        ]);

        return response()->json([
            'message' =>
                'Contraseña actualizada correctamente.',
        ]);
    }

    public function cerrarSesion(
        Request $request
    ): JsonResponse {
        $usuario = $request->user();

        if (! $usuario instanceof Usuario) {
            return response()->json([
                'message' => 'Usuario no autenticado.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $this->authService->cerrarSesion(
            $usuario
        );

        return response()->json([
            'message' =>
                'Sesión cerrada correctamente.',
        ]);
    }

    public function redirigirAGoogle(): RedirectResponse
    {
        /** @var AbstractProvider $proveedorGoogle */
        $proveedorGoogle =
            Socialite::driver('google');

        return $proveedorGoogle
            ->stateless()
            ->redirect();
    }

    public function callbackGoogle(): RedirectResponse
    {
        $frontendUrl = rtrim(
            env(
                'FRONTEND_URL',
                'http://localhost:5173'
            ),
            '/'
        );

        try {
            /** @var AbstractProvider $proveedorGoogle */
            $proveedorGoogle =
                Socialite::driver('google');

            $usuarioGoogle =
                $proveedorGoogle
                    ->stateless()
                    ->user();

            $resultado =
                $this->authService
                    ->autenticarConGoogle(
                        $usuarioGoogle
                    );

            $token =
                $resultado['token'];

            return redirect()->away(
                $frontendUrl
                . '/auth/google/callback#token='
                . rawurlencode($token)
            );
        } catch (Throwable $e) {
            report($e);

            $mensaje =
                'No fue posible completar la autenticación con Google.';

            return redirect()->away(
                $frontendUrl
                . '/auth/google/callback#error='
                . rawurlencode($mensaje)
            );
        }
    }

    private function normalizarDatoOpcional(
        ?string $valor
    ): ?string {
        if ($valor === null) {
            return null;
        }

        $valor = trim($valor);

        return $valor === ''
            ? null
            : $valor;
    }
}