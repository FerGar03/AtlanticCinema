<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFacturaRequest;
use App\Models\Factura;
use App\Models\Venta;
use App\Services\FacturaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class FacturaController extends Controller
{
    public function __construct(
        private readonly FacturaService $facturaService
    ) {
    }

    /**
     * Lista las facturas autorizadas para el usuario autenticado.
     */
    public function index(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', Factura::class);

        $usuario = $request->user();

        $consulta = Factura::query()
            ->with([
                'venta',
                'detalles.entrada',
                'intentos',
            ]);

        if ($usuario->rol?->nombre === 'Cliente') {
            $consulta->whereHas(
                'venta',
                function ($query) use ($usuario): void {
                    $query->where(
                        'cliente_id',
                        $usuario->id
                    );
                }
            );
        }

        $facturas = $consulta
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
        Gate::authorize('create', Factura::class);

        $datos = $request->validated();

        $venta = Venta::query()
            ->findOrFail(
                (int) $datos['venta_id']
            );

        Gate::authorize(
            'generarParaVenta',
            [Factura::class, $venta]
        );

        $factura = $this->facturaService->generar(
            $venta->id,
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
        Gate::authorize('view', $factura);

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