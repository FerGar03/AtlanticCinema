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
            'message' => 'Usuario autenticado obtenido correctamente.',
            'data' => $usuario,
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

        $this->authService->cerrarSesion($usuario);

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }

    public function redirigirAGoogle(): RedirectResponse
    {
        /** @var AbstractProvider $proveedorGoogle */
        $proveedorGoogle = Socialite::driver('google');

        return $proveedorGoogle
            ->stateless()
            ->redirect();
    }

    public function callbackGoogle(): JsonResponse
    {
        try {
            /** @var AbstractProvider $proveedorGoogle */
            $proveedorGoogle = Socialite::driver('google');

            $usuarioGoogle = $proveedorGoogle
                ->stateless()
                ->user();

            $resultado = $this->authService->autenticarConGoogle(
                $usuarioGoogle
            );

            return response()->json([
                'message' => 'Autenticación con Google completada correctamente.',
                'data' => [
                    'usuario' => $resultado['usuario'],
                    'token' => $resultado['token'],
                    'tipo_token' => 'Bearer',
                ],
            ]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'No fue posible completar la autenticación con Google.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }
}