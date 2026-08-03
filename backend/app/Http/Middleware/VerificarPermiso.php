<?php

namespace App\Http\Middleware;

use App\Models\Usuario;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerificarPermiso
{
    public function handle(
        Request $request,
        Closure $next,
        string $permiso
    ): Response|JsonResponse {
        $usuario = $request->user();

        if (! $usuario instanceof Usuario) {
            return response()->json([
                'message' => 'Usuario no autenticado.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if ($usuario->estado !== 'ACTIVO') {
            return response()->json([
                'message' => 'El usuario no se encuentra activo.',
            ], Response::HTTP_FORBIDDEN);
        }

        $tienePermiso = $usuario->rol()
            ->where('estado', 'ACTIVO')
            ->whereHas('permisos', function ($consulta) use ($permiso): void {
                $consulta
                    ->where('permisos.nombre', $permiso)
                    ->where('permisos.estado', 'ACTIVO');
            })
            ->exists();

        if (! $tienePermiso) {
            return response()->json([
                'message' => 'No posee permisos para realizar esta acción.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}