<?php

namespace App\Services;

use App\Contracts\ProveedorFelInterface;
use Illuminate\Support\Str;

class SimuladorFelService implements ProveedorFelInterface
{
    /**
     * Simula la certificación de una factura electrónica FEL.
     *
     * @param  array<string, mixed>  $datosFactura
     * @return array<string, mixed>
     */
    public function certificar(array $datosFactura): array
    {
        $uuid = (string) Str::uuid();

        return [
            'exitoso' => true,
            'codigo_respuesta' => 'FEL-200',
            'mensaje_respuesta' => 'Factura certificada correctamente por el simulador FEL.',
            'serie' => 'ATL',
            'numero_documento' => $this->generarNumeroDocumento(),
            'uuid' => $uuid,
            'certificada_en' => now()->toISOString(),
            'datos_proveedor' => [
                'proveedor' => 'SIMULADOR_FEL',
                'ambiente' => 'PRUEBAS',
                'tipo_documento' => $datosFactura['tipo_documento'] ?? 'FACTURA',
                'numero_interno' => $datosFactura['numero_interno'] ?? null,
                'nit_receptor' => $datosFactura['nit_receptor'] ?? 'CF',
                'nombre_receptor' => $datosFactura['nombre_receptor'] ?? null,
                'total' => $datosFactura['total'] ?? null,
            ],
        ];
    }

    private function generarNumeroDocumento(): string
    {
        return now()->format('YmdHis')
            . '-'
            . strtoupper(Str::random(6));
    }
}