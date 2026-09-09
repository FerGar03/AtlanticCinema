<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rol;
use Illuminate\Http\JsonResponse;

class RolController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Rol::query()
            ->where('estado', 'ACTIVO')
            ->orderBy('nombre')
            ->get([
                'id',
                'nombre',
                'descripcion',
                'estado',
            ]);

        return response()->json([
            'message' => 'Roles obtenidos correctamente.',
            'data' => $roles,
        ]);
    }
}