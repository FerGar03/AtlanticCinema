<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReporteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReporteController extends Controller
{
    public function __construct(
        private readonly ReporteService $reporteService
    ) {
    }

    public function resumen(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'desde' => [
                'nullable',
                'date',
            ],
            'hasta' => [
                'nullable',
                'date',
                'after_or_equal:desde',
            ],
        ], [
            'desde.date' => 'La fecha inicial no es válida.',
            'hasta.date' => 'La fecha final no es válida.',
            'hasta.after_or_equal' =>
                'La fecha final debe ser igual o posterior a la fecha inicial.',
        ]);

        $resultado = $this->reporteService->obtenerResumen(
            $datos['desde'] ?? null,
            $datos['hasta'] ?? null,
        );

        return response()->json($resultado);
    }
}