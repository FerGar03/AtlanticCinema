<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Clasificacion;
use Illuminate\Http\JsonResponse;

class ClasificacionController extends Controller
{
    public function index(): JsonResponse
    {
        $clasificaciones = Clasificacion::query()
            ->where('estado', 'ACTIVO')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'data' => $clasificaciones,
        ]);
    }
}