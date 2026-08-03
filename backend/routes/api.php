<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\FacturaController;
use App\Http\Controllers\Api\FuncionController;
use App\Http\Controllers\Api\NotificacionController;
use App\Http\Controllers\Api\PagoController;
use App\Http\Controllers\Api\ReservaController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\VentaController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/registro', [
        AuthController::class,
        'registrar',
    ]);

    Route::post('/login', [
        AuthController::class,
        'iniciarSesion',
    ]);

    Route::get('/google', [
        AuthController::class,
        'redirigirAGoogle',
    ]);

    Route::get('/google/callback', [
        AuthController::class,
        'callbackGoogle',
    ]);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/usuario', [
            AuthController::class,
            'usuarioAutenticado',
        ]);

        Route::post('/logout', [
            AuthController::class,
            'cerrarSesion',
        ]);
    });
});

Route::get('/funciones', [
    FuncionController::class,
    'index',
]);

Route::post('/funciones', [
    FuncionController::class,
    'store',
])->middleware([
    'auth:sanctum',
    'permiso:funciones.crear',
]);

Route::get('/funciones/{funcion}', [
    FuncionController::class,
    'show',
])->whereNumber('funcion');

Route::get('/reservas', [
    ReservaController::class,
    'index',
]);

Route::post('/reservas', [
    ReservaController::class,
    'store',
]);

Route::get('/reservas/{reserva}', [
    ReservaController::class,
    'show',
]);

Route::get('/ventas', [
    VentaController::class,
    'index',
])->middleware([
    'auth:sanctum',
    'permiso:ventas.ver',
]);

Route::post('/ventas/desde-reserva', [
    VentaController::class,
    'storeDesdeReserva',
]);

Route::get('/ventas/{venta}', [
    VentaController::class,
    'show',
]);

Route::get('/pagos', [
    PagoController::class,
    'index',
]);

Route::post('/pagos', [
    PagoController::class,
    'store',
]);

Route::post('/pagos/{pago}/confirmar-simulacion', [
    PagoController::class,
    'confirmarSimulacion',
])->whereNumber('pago');

Route::get('/pagos/{pago}', [
    PagoController::class,
    'show',
])->whereNumber('pago');

Route::get('/facturas', [
    FacturaController::class,
    'index',
]);

Route::post('/facturas', [
    FacturaController::class,
    'store',
]);

Route::get('/facturas/{factura}', [
    FacturaController::class,
    'show',
]);

Route::get('/tickets', [
    TicketController::class,
    'index',
]);

Route::post('/tickets', [
    TicketController::class,
    'store',
]);

Route::post('/tickets/validar', [
    TicketController::class,
    'validar',
]);

Route::get('/tickets/{ticket}', [
    TicketController::class,
    'show',
])->whereNumber('ticket');

Route::get('/notificaciones', [
    NotificacionController::class,
    'index',
]);

Route::post('/notificaciones/procesar', [
    NotificacionController::class,
    'procesar',
]);

Route::get('/notificaciones/{notificacion}', [
    NotificacionController::class,
    'show',
])->whereNumber('notificacion');