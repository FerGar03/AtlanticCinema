<?php

namespace App\Services;

use App\Contracts\ProveedorFelInterface;
use App\Models\Factura;
use App\Models\FacturaIntento;
use App\Models\Venta;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class FacturaService
{
    public function __construct(
        private readonly ProveedorFelInterface $proveedorFel
    ) {
    }

    /**
     * Genera y certifica una factura FEL para una venta pagada.
     *
     * @param  array<string, mixed>  $datosReceptor
     */
    public function generar(int $ventaId, array $datosReceptor): Factura
    {
        [$factura, $intento, $datosCertificacion] = DB::transaction(
            function () use ($ventaId, $datosReceptor): array {
                $venta = Venta::query()
                    ->with([
                        'entradas.funcionAsiento.asiento',
                        'funcion.pelicula',
                        'funcion.sala',
                        'factura',
                    ])
                    ->lockForUpdate()
                    ->find($ventaId);

                if (! $venta) {
                    throw ValidationException::withMessages([
                        'venta_id' => [
                            'La venta indicada no existe.',
                        ],
                    ]);
                }

                if ($venta->estado !== 'PAGADA') {
                    throw ValidationException::withMessages([
                        'venta_id' => [
                            'Solo es posible facturar una venta pagada.',
                        ],
                    ]);
                }

                if ($venta->factura !== null) {
                    throw ValidationException::withMessages([
                        'venta_id' => [
                            'La venta ya posee una factura electrónica.',
                        ],
                    ]);
                }

                if ($venta->entradas->isEmpty()) {
                    throw ValidationException::withMessages([
                        'venta_id' => [
                            'La venta no posee entradas para facturar.',
                        ],
                    ]);
                }

                $nitReceptor = strtoupper(
                    trim((string) ($datosReceptor['nit_receptor'] ?? 'CF'))
                );

                $nombreReceptor = trim(
                    (string) ($datosReceptor['nombre_receptor'] ?? '')
                );

                if ($nitReceptor === '') {
                    $nitReceptor = 'CF';
                }

                if ($nombreReceptor === '') {
                    $nombreReceptor = $nitReceptor === 'CF'
                        ? 'Consumidor Final'
                        : '';
                }

                if ($nombreReceptor === '') {
                    throw ValidationException::withMessages([
                        'nombre_receptor' => [
                            'El nombre del receptor es obligatorio.',
                        ],
                    ]);
                }

                $factura = Factura::create([
                    'venta_id' => $venta->id,
                    'numero_interno' => $this->generarNumeroInterno(),
                    'tipo_documento' => 'FACTURA',
                    'nit_receptor' => $nitReceptor,
                    'nombre_receptor' => $nombreReceptor,
                    'subtotal' => $venta->subtotal,
                    'descuento' => $venta->descuento,
                    'impuestos' => 0,
                    'total' => $venta->total,
                    'estado' => 'PENDIENTE',
                ]);

                foreach ($venta->entradas as $indice => $entrada) {
                    $funcionAsiento = $entrada->funcionAsiento;
                    $asiento = $funcionAsiento?->asiento;

                    $descripcion = sprintf(
                        'Entrada para %s - %s - Asiento %s%s',
                        $venta->funcion?->pelicula?->titulo
                            ?? 'Película',
                        $venta->funcion?->sala?->nombre
                            ?? 'Sala',
                        $asiento?->fila
                            ?? '',
                        $asiento?->numero
                            ?? $entrada->id
                    );

                    $factura->detalles()->create([
                        'entrada_id' => $entrada->id,
                        'numero_linea' => $indice + 1,
                        'descripcion' => $descripcion,
                        'cantidad' => 1,
                        'precio_unitario' => $entrada->precio,
                        'descuento' => 0,
                        'subtotal' => $entrada->precio,
                        'monto_impuesto' => 0,
                        'total_linea' => $entrada->precio,
                    ]);
                }

                $factura->load('detalles');

                $datosCertificacion = $this->construirDatosCertificacion(
                    $factura
                );

                $intento = $factura->intentos()->create([
                    'numero_intento' => 1,
                    'operacion' => 'CERTIFICACION',
                    'estado' => 'PENDIENTE',
                    'idempotency_key' => (string) Str::uuid(),
                    'solicitud' => $datosCertificacion,
                ]);

                return [
                    $factura,
                    $intento,
                    $datosCertificacion,
                ];
            }
        );

        try {
            $respuesta = $this->proveedorFel->certificar(
                $datosCertificacion
            );

            if (! ($respuesta['exitoso'] ?? false)) {
                return $this->registrarErrorProveedor(
                    $factura,
                    $intento,
                    $respuesta
                );
            }

            return DB::transaction(
                function () use (
                    $factura,
                    $intento,
                    $respuesta
                ): Factura {
                    $facturaBloqueada = Factura::query()
                        ->lockForUpdate()
                        ->findOrFail($factura->id);

                    $intentoBloqueado = FacturaIntento::query()
                        ->lockForUpdate()
                        ->findOrFail($intento->id);

                    $facturaBloqueada->update([
                        'serie' => $respuesta['serie'] ?? null,
                        'numero_documento' =>
                            $respuesta['numero_documento'] ?? null,
                        'uuid' => $respuesta['uuid'] ?? null,
                        'estado' => 'CERTIFICADA',
                        'certificada_en' => now(),
                    ]);

                    $intentoBloqueado->update([
                        'estado' => 'EXITOSO',
                        'codigo_respuesta' =>
                            $respuesta['codigo_respuesta'] ?? 'FEL-200',
                        'mensaje_respuesta' =>
                            $respuesta['mensaje_respuesta']
                                ?? 'Factura certificada correctamente.',
                        'respuesta' => $respuesta,
                        'procesado_en' => now(),
                    ]);

                    return $facturaBloqueada->fresh([
                        'venta',
                        'detalles.entrada',
                        'intentos',
                    ]);
                }
            );
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            DB::transaction(
                function () use (
                    $factura,
                    $intento,
                    $exception
                ): void {
                    Factura::query()
                        ->whereKey($factura->id)
                        ->update([
                            'estado' => 'ERROR',
                        ]);

                    FacturaIntento::query()
                        ->whereKey($intento->id)
                        ->update([
                            'estado' => 'ERROR',
                            'codigo_respuesta' => 'FEL-500',
                            'mensaje_respuesta' =>
                                $exception->getMessage(),
                            'respuesta' => [
                                'excepcion' => get_class($exception),
                                'mensaje' => $exception->getMessage(),
                            ],
                            'procesado_en' => now(),
                        ]);
                }
            );

            throw ValidationException::withMessages([
                'factura' => [
                    'No fue posible certificar la factura electrónica.',
                ],
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function construirDatosCertificacion(
        Factura $factura
    ): array {
        return [
            'numero_interno' => $factura->numero_interno,
            'tipo_documento' => $factura->tipo_documento,
            'nit_receptor' => $factura->nit_receptor,
            'nombre_receptor' => $factura->nombre_receptor,
            'subtotal' => $factura->subtotal,
            'descuento' => $factura->descuento,
            'impuestos' => $factura->impuestos,
            'total' => $factura->total,
            'detalles' => $factura->detalles
                ->map(fn ($detalle): array => [
                    'numero_linea' => $detalle->numero_linea,
                    'descripcion' => $detalle->descripcion,
                    'cantidad' => $detalle->cantidad,
                    'precio_unitario' => $detalle->precio_unitario,
                    'descuento' => $detalle->descuento,
                    'subtotal' => $detalle->subtotal,
                    'monto_impuesto' => $detalle->monto_impuesto,
                    'total_linea' => $detalle->total_linea,
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $respuesta
     */
    private function registrarErrorProveedor(
        Factura $factura,
        FacturaIntento $intento,
        array $respuesta
    ): Factura {
        DB::transaction(
            function () use (
                $factura,
                $intento,
                $respuesta
            ): void {
                Factura::query()
                    ->whereKey($factura->id)
                    ->update([
                        'estado' => 'ERROR',
                    ]);

                FacturaIntento::query()
                    ->whereKey($intento->id)
                    ->update([
                        'estado' => 'ERROR',
                        'codigo_respuesta' =>
                            $respuesta['codigo_respuesta']
                                ?? 'FEL-400',
                        'mensaje_respuesta' =>
                            $respuesta['mensaje_respuesta']
                                ?? 'El proveedor rechazó la factura.',
                        'respuesta' => $respuesta,
                        'procesado_en' => now(),
                    ]);
            }
        );

        throw ValidationException::withMessages([
            'factura' => [
                $respuesta['mensaje_respuesta']
                    ?? 'El proveedor FEL rechazó la factura.',
            ],
        ]);
    }

    private function generarNumeroInterno(): string
    {
        do {
            $numero = 'FAC-'
                . now()->format('Ymd')
                . '-'
                . strtoupper(Str::random(10));
        } while (
            Factura::query()
                ->where('numero_interno', $numero)
                ->exists()
        );

        return $numero;
    }
}