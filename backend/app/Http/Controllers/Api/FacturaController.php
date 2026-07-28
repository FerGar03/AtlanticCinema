<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFacturaRequest;
use App\Models\Factura;
use App\Services\FacturaService;
use Illuminate\Http\JsonResponse;

class FacturaController extends Controller
{
    public function __construct(
        private readonly FacturaService $facturaService
    ) {
    }

    /**
     * Listado de facturas.
     */
    public function index(): JsonResponse
    {
        $facturas = Factura::query()
            ->with([
                'venta',
                'detalles.entrada',
                'intentos',
            ])
            ->latest('id')
            ->get();

        return response()->json([
            'message' => 'Facturas obtenidas correctamente.',
            'data' => $facturas,
        ]);
    }

    /**
     * Genera y certifica una factura FEL.
     */
    public function store(
        StoreFacturaRequest $request
    ): JsonResponse {
        $datos = $request->validated();

        $factura = $this->facturaService->generar(
            (int) $datos['venta_id'],
            [
                'nit_receptor' => $datos['nit_receptor'],
                'nombre_receptor' => $datos['nombre_receptor'],
            ]
        );

        return response()->json([
            'message' => 'Factura electrónica generada y certificada correctamente.',
            'data' => $factura,
        ], 201);
    }

    /**
     * Muestra una factura específica.
     */
    public function show(
        Factura $factura
    ): JsonResponse {
        $factura->load([
            'venta',
            'detalles.entrada',
            'intentos',
        ]);

        return response()->json([
            'message' => 'Factura obtenida correctamente.',
            'data' => $factura,
        ]);
    }
}