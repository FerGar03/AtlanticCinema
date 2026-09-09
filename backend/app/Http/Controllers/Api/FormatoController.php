<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Formato;
use Illuminate\Http\JsonResponse;

class FormatoController extends Controller
{
    public function index(): JsonResponse
    {
        $formatos = Formato::query()
            ->where('estado', 'ACTIVO')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'message' => 'Formatos obtenidos correctamente.',
            'data' => $formatos,
        ]);
    }
}