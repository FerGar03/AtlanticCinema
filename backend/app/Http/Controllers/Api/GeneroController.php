<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Genero;
use Illuminate\Http\JsonResponse;

class GeneroController extends Controller
{
    public function index(): JsonResponse
    {
        $generos = Genero::query()
            ->where('estado', 'ACTIVO')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'data' => $generos,
        ]);
    }
}