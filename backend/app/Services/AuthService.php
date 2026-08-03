<?php

namespace App\Services;

use App\Models\Rol;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class AuthService
{
    public function registrar(array $datos): array
    {
        return DB::transaction(function () use ($datos): array {
            $rolCliente = Rol::query()
                ->where('nombre', 'Cliente')
                ->where('estado', 'ACTIVO')
                ->first();

            if (! $rolCliente) {
                throw new HttpException(
                    500,
                    'El rol Cliente no se encuentra disponible.'
                );
            }

            $usuario = Usuario::query()->create([
                'rol_id' => $rolCliente->id,
                'nombres' => trim($datos['nombres']),
                'apellidos' => trim($datos['apellidos']),
                'correo' => $datos['correo'],
                'password' => $datos['password'],
                'telefono' => $datos['telefono'] ?? null,
                'nit' => $datos['nit'] ?? null,
                'direccion' => $datos['direccion'] ?? null,
                'estado' => 'ACTIVO',
                'ultimo_acceso_en' => now(),
            ]);

            $token = $usuario
                ->createToken($datos['nombre_dispositivo'] ?? 'atlantic-cinema')
                ->plainTextToken;

            $usuario->load('rol');

            return [
                'usuario' => $usuario,
                'token' => $token,
            ];
        });
    }

    public function iniciarSesion(array $datos): array
    {
        $usuario = Usuario::query()
            ->where('correo', $datos['correo'])
            ->first();

        if (
            ! $usuario
            || $usuario->password === null
            || ! Hash::check($datos['password'], $usuario->password)
        ){
            throw ValidationException::withMessages([
                'correo' => [
                    'Las credenciales proporcionadas no son correctas.',
                ],
            ]);
        }

        if ($usuario->estado !== 'ACTIVO') {
            throw new HttpException(
                403,
                match ($usuario->estado) {
                    'BLOQUEADO' => 'El usuario se encuentra bloqueado.',
                    default => 'El usuario se encuentra inactivo.',
                }
            );
        }

        $usuario->forceFill([
            'ultimo_acceso_en' => now(),
        ])->save();

        $token = $usuario
            ->createToken($datos['nombre_dispositivo'] ?? 'atlantic-cinema')
            ->plainTextToken;

        $usuario->load('rol');

        return [
            'usuario' => $usuario,
            'token' => $token,
        ];
    }

    public function cerrarSesion(Usuario $usuario): void
    {
        $tokenActual = $usuario->currentAccessToken();

        if ($tokenActual instanceof PersonalAccessToken) {
        $tokenActual->delete();
        }
    }

    public function autenticarConGoogle(
    SocialiteUser $usuarioGoogle
): array {
    return DB::transaction(function () use ($usuarioGoogle): array {
        $correo = mb_strtolower(trim((string) $usuarioGoogle->getEmail()));
        $googleId = (string) $usuarioGoogle->getId();

        if ($correo === '' || $googleId === '') {
            throw new HttpException(
                422,
                'Google no proporcionó la información necesaria para autenticar al usuario.'
            );
        }

        $usuario = Usuario::query()
            ->where('google_id', $googleId)
            ->orWhere('correo', $correo)
            ->first();

        if ($usuario) {
            if ($usuario->estado !== 'ACTIVO') {
                throw new HttpException(
                    403,
                    match ($usuario->estado) {
                        'BLOQUEADO' => 'El usuario se encuentra bloqueado.',
                        default => 'El usuario se encuentra inactivo.',
                    }
                );
            }

            if (
                $usuario->google_id !== null
                && $usuario->google_id !== $googleId
            ) {
                throw new HttpException(
                    409,
                    'El correo ya se encuentra vinculado con otra cuenta de Google.'
                );
            }

            $usuario->forceFill([
                'google_id' => $googleId,
                'avatar_url' => $usuarioGoogle->getAvatar(),
                'correo_verificado_en' => $usuario->correo_verificado_en ?? now(),
                'ultimo_acceso_en' => now(),
            ])->save();
        } else {
            $rolCliente = Rol::query()
                ->where('nombre', 'Cliente')
                ->where('estado', 'ACTIVO')
                ->first();

            if (! $rolCliente) {
                throw new HttpException(
                    500,
                    'El rol Cliente no se encuentra disponible.'
                );
            }

            $nombreCompleto = trim((string) $usuarioGoogle->getName());
            $partesNombre = preg_split('/\s+/', $nombreCompleto) ?: [];

            $nombres = array_shift($partesNombre) ?: 'Usuario';
            $apellidos = count($partesNombre) > 0
                ? implode(' ', $partesNombre)
                : 'Google';

            $usuario = Usuario::query()->create([
                'rol_id' => $rolCliente->id,
                'nombres' => Str::limit($nombres, 100, ''),
                'apellidos' => Str::limit($apellidos, 100, ''),
                'correo' => $correo,
                'google_id' => $googleId,
                'avatar_url' => $usuarioGoogle->getAvatar(),
                'password' => null,
                'correo_verificado_en' => now(),
                'estado' => 'ACTIVO',
                'ultimo_acceso_en' => now(),
            ]);
        }

        $token = $usuario
            ->createToken('google-oauth')
            ->plainTextToken;

        $usuario->load('rol');

        return [
            'usuario' => $usuario,
            'token' => $token,
        ];
    });
    }
}