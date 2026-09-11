<?php

namespace App\Services;

use App\Models\Entrada;
use App\Models\Funcion;
use App\Models\Reserva;
use App\Models\Venta;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReporteService
{
    public function obtenerResumen(
        ?string $desde = null,
        ?string $hasta = null
    ): array {
        $fechaDesde = $desde
            ? Carbon::parse($desde)->startOfDay()
            : null;

        $fechaHasta = $hasta
            ? Carbon::parse($hasta)->endOfDay()
            : null;

        $ventasPagadas = Venta::query()
            ->where('estado', 'PAGADA');

        $reservas = Reserva::query();

        $funciones = Funcion::query();

        $entradasVendidas = Entrada::query()
            ->whereHas('venta', function ($query) use (
                $fechaDesde,
                $fechaHasta
            ) {
                $query->where('estado', 'PAGADA');

                if ($fechaDesde) {
                    $query->where(
                        'pagada_en',
                        '>=',
                        $fechaDesde
                    );
                }

                if ($fechaHasta) {
                    $query->where(
                        'pagada_en',
                        '<=',
                        $fechaHasta
                    );
                }
            });

        if ($fechaDesde) {
            $ventasPagadas->where(
                'pagada_en',
                '>=',
                $fechaDesde
            );

            $reservas->where(
                'created_at',
                '>=',
                $fechaDesde
            );

            $funciones->where(
                'inicia_en',
                '>=',
                $fechaDesde
            );
        }

        if ($fechaHasta) {
            $ventasPagadas->where(
                'pagada_en',
                '<=',
                $fechaHasta
            );

            $reservas->where(
                'created_at',
                '<=',
                $fechaHasta
            );

            $funciones->where(
                'inicia_en',
                '<=',
                $fechaHasta
            );
        }

        $ingresos = (float) (clone $ventasPagadas)
            ->sum('total');

        $totalVentasPagadas = (clone $ventasPagadas)
            ->count();

        $totalEntradasVendidas = $entradasVendidas
            ->count();

        $totalReservas = (clone $reservas)
            ->count();

        $reservasConvertidas = (clone $reservas)
            ->where('estado', 'CONVERTIDA')
            ->count();

        $totalFunciones = (clone $funciones)
            ->count();

        $ventasCompraWeb = (clone $ventasPagadas)
            ->where('origen', 'COMPRA_WEB')
            ->count();

        $ventasDesdeReserva = (clone $ventasPagadas)
            ->where('origen', 'RESERVA')
            ->count();

        $conversionReservas = $totalReservas > 0
            ? round(
                ($reservasConvertidas / $totalReservas) * 100,
                2
            )
            : 0;

        $ticketPromedio = $totalVentasPagadas > 0
            ? round(
                $ingresos / $totalVentasPagadas,
                2
            )
            : 0;

        return [
            'periodo' => [
                'desde' => $fechaDesde?->toDateString(),
                'hasta' => $fechaHasta?->toDateString(),
            ],

            'resumen' => [
                'ingresos' => $ingresos,
                'ventas_pagadas' => $totalVentasPagadas,
                'entradas_vendidas' => $totalEntradasVendidas,
                'reservas' => $totalReservas,
                'reservas_convertidas' => $reservasConvertidas,
                'funciones' => $totalFunciones,
                'ventas_compra_web' => $ventasCompraWeb,
                'ventas_desde_reserva' => $ventasDesdeReserva,
                'conversion_reservas' => $conversionReservas,
                'ticket_promedio' => $ticketPromedio,
            ],

            'ventas_por_pelicula' =>
                $this->obtenerVentasPorPelicula(
                    $fechaDesde,
                    $fechaHasta
                ),

            'reservas_por_estado' =>
                $this->obtenerReservasPorEstado(
                    $fechaDesde,
                    $fechaHasta
                ),

            'pagos_por_metodo' =>
                $this->obtenerPagosPorMetodo(
                    $fechaDesde,
                    $fechaHasta
                ),

            'ocupacion_funciones' =>
                $this->obtenerOcupacionFunciones(
                    $fechaDesde,
                    $fechaHasta
                ),
        ];
    }

    private function obtenerVentasPorPelicula(
        ?Carbon $fechaDesde,
        ?Carbon $fechaHasta
    ): array {
        $entradasPorVenta = DB::table('entradas')
            ->select(
                'venta_id',
                DB::raw('COUNT(*) as cantidad_entradas')
            )
            ->groupBy('venta_id');

        $query = DB::table('ventas')
            ->join(
                'funciones',
                'funciones.id',
                '=',
                'ventas.funcion_id'
            )
            ->join(
                'peliculas',
                'peliculas.id',
                '=',
                'funciones.pelicula_id'
            )
            ->leftJoinSub(
                $entradasPorVenta,
                'entradas_por_venta',
                function ($join) {
                    $join->on(
                        'entradas_por_venta.venta_id',
                        '=',
                        'ventas.id'
                    );
                }
            )
            ->where(
                'ventas.estado',
                'PAGADA'
            );

        if ($fechaDesde) {
            $query->where(
                'ventas.pagada_en',
                '>=',
                $fechaDesde
            );
        }

        if ($fechaHasta) {
            $query->where(
                'ventas.pagada_en',
                '<=',
                $fechaHasta
            );
        }

        return $query
            ->select(
                'peliculas.id as pelicula_id',
                'peliculas.titulo',
                DB::raw(
                    'COUNT(ventas.id) as ventas'
                ),
                DB::raw(
                    'SUM(
                        COALESCE(
                            entradas_por_venta.cantidad_entradas,
                            0
                        )
                    ) as entradas'
                ),
                DB::raw(
                    'SUM(ventas.total) as ingresos'
                )
            )
            ->groupBy(
                'peliculas.id',
                'peliculas.titulo'
            )
            ->orderByDesc('ingresos')
            ->get()
            ->map(function ($registro) {
                return [
                    'pelicula_id' =>
                        $registro->pelicula_id,

                    'titulo' =>
                        $registro->titulo,

                    'ventas' =>
                        (int) $registro->ventas,

                    'entradas' =>
                        (int) $registro->entradas,

                    'ingresos' =>
                        (float) $registro->ingresos,
                ];
            })
            ->values()
            ->all();
    }

    private function obtenerReservasPorEstado(
        ?Carbon $fechaDesde,
        ?Carbon $fechaHasta
    ): array {
        $query = DB::table('reservas');

        if ($fechaDesde) {
            $query->where(
                'created_at',
                '>=',
                $fechaDesde
            );
        }

        if ($fechaHasta) {
            $query->where(
                'created_at',
                '<=',
                $fechaHasta
            );
        }

        $cantidades = $query
            ->select(
                'estado',
                DB::raw('COUNT(*) as cantidad')
            )
            ->groupBy('estado')
            ->pluck(
                'cantidad',
                'estado'
            );

        return [
            'PENDIENTE' =>
                (int) ($cantidades['PENDIENTE'] ?? 0),

            'CONVERTIDA' =>
                (int) ($cantidades['CONVERTIDA'] ?? 0),

            'CANCELADA' =>
                (int) ($cantidades['CANCELADA'] ?? 0),

            'VENCIDA' =>
                (int) ($cantidades['VENCIDA'] ?? 0),
        ];
    }

    private function obtenerPagosPorMetodo(
        ?Carbon $fechaDesde,
        ?Carbon $fechaHasta
    ): array {
        $query = DB::table('pagos')
            ->join(
                'metodos_pago',
                'metodos_pago.id',
                '=',
                'pagos.metodo_pago_id'
            )
            ->where(
                'pagos.estado',
                'APROBADO'
            );

        if ($fechaDesde) {
            $query->where(
                'pagos.aprobado_en',
                '>=',
                $fechaDesde
            );
        }

        if ($fechaHasta) {
            $query->where(
                'pagos.aprobado_en',
                '<=',
                $fechaHasta
            );
        }

        return $query
            ->select(
                'metodos_pago.codigo as metodo',
                'metodos_pago.nombre',
                DB::raw(
                    'COUNT(pagos.id) as cantidad'
                ),
                DB::raw(
                    'SUM(pagos.monto) as monto'
                )
            )
            ->groupBy(
                'metodos_pago.id',
                'metodos_pago.codigo',
                'metodos_pago.nombre'
            )
            ->orderBy('metodos_pago.nombre')
            ->get()
            ->map(function ($registro) {
                return [
                    'metodo' =>
                        $registro->metodo,

                    'nombre' =>
                        $registro->nombre,

                    'cantidad' =>
                        (int) $registro->cantidad,

                    'monto' =>
                        (float) $registro->monto,
                ];
            })
            ->values()
            ->all();
    }

    private function obtenerOcupacionFunciones(
        ?Carbon $fechaDesde,
        ?Carbon $fechaHasta
    ): array {
        $query = DB::table('funciones')
            ->join(
                'peliculas',
                'peliculas.id',
                '=',
                'funciones.pelicula_id'
            )
            ->join(
                'salas',
                'salas.id',
                '=',
                'funciones.sala_id'
            )
            ->join(
                'funcion_asientos',
                'funcion_asientos.funcion_id',
                '=',
                'funciones.id'
            );

        if ($fechaDesde) {
            $query->where(
                'funciones.inicia_en',
                '>=',
                $fechaDesde
            );
        }

        if ($fechaHasta) {
            $query->where(
                'funciones.inicia_en',
                '<=',
                $fechaHasta
            );
        }

        return $query
            ->select(
                'funciones.id as funcion_id',
                'peliculas.titulo as pelicula',
                'salas.nombre as sala',
                'funciones.inicia_en',
                DB::raw(
                    'COUNT(funcion_asientos.id) as asientos_totales'
                ),
                DB::raw(
                    "SUM(
                        CASE
                            WHEN funcion_asientos.estado = 'VENDIDO'
                            THEN 1
                            ELSE 0
                        END
                    ) as asientos_vendidos"
                )
            )
            ->groupBy(
                'funciones.id',
                'peliculas.titulo',
                'salas.nombre',
                'funciones.inicia_en'
            )
            ->orderByDesc('funciones.inicia_en')
            ->get()
            ->map(function ($registro) {
                $total = (int)
                    $registro->asientos_totales;

                $vendidos = (int)
                    $registro->asientos_vendidos;

                $porcentaje = $total > 0
                    ? round(
                        ($vendidos / $total) * 100,
                        2
                    )
                    : 0;

                return [
                    'funcion_id' =>
                        $registro->funcion_id,

                    'pelicula' =>
                        $registro->pelicula,

                    'sala' =>
                        $registro->sala,

                    'inicia_en' =>
                        $registro->inicia_en,

                    'asientos_totales' =>
                        $total,

                    'asientos_vendidos' =>
                        $vendidos,

                    'ocupacion_porcentaje' =>
                        $porcentaje,
                ];
            })
            ->values()
            ->all();
    }
}