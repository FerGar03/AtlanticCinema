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

/*
|--------------------------------------------------------------------------
| Funciones
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Reservas
|--------------------------------------------------------------------------
*/

Route::get('/reservas', [
    ReservaController::class,
    'index',
])->middleware([
    'auth:sanctum',
    'permiso:reservas.ver',
]);

Route::post('/reservas', [
    ReservaController::class,
    'store',
])->middleware([
    'auth:sanctum',
    'permiso:reservas.crear',
]);

Route::get('/reservas/{reserva}', [
    ReservaController::class,
    'show',
])->middleware([
    'auth:sanctum',
    'permiso:reservas.ver',
])->whereNumber('reserva');

/*
|--------------------------------------------------------------------------
| Ventas
|--------------------------------------------------------------------------
*/

Route::get('/ventas', [
    VentaController::class,
    'index',
])->middleware([
    'auth:sanctum',
    'permiso:ventas.ver',
]);

Route::post('/ventas/directa', [
    VentaController::class,
    'storeDirecta',
])->middleware([
    'auth:sanctum',
    'permiso:ventas.registrar',
]);

Route::post('/ventas/desde-reserva', [
    VentaController::class,
    'storeDesdeReserva',
])->middleware([
    'auth:sanctum',
    'permiso:ventas.registrar',
]);

Route::get('/ventas/{venta}', [
    VentaController::class,
    'show',
])->middleware([
    'auth:sanctum',
    'permiso:ventas.ver',
])->whereNumber('venta');

/*
|--------------------------------------------------------------------------
| Pagos
|--------------------------------------------------------------------------
*/

Route::get('/pagos', [
    PagoController::class,
    'index',
])->middleware([
    'auth:sanctum',
    'permiso:pagos.ver',
]);

Route::post('/pagos', [
    PagoController::class,
    'store',
])->middleware([
    'auth:sanctum',
    'permiso:pagos.registrar',
]);

Route::post('/pagos/{pago}/confirmar-simulacion', [
    PagoController::class,
    'confirmarSimulacion',
])->middleware([
    'auth:sanctum',
    'permiso:pagos.registrar',
])->whereNumber('pago');

Route::get('/pagos/{pago}', [
    PagoController::class,
    'show',
])->middleware([
    'auth:sanctum',
    'permiso:pagos.ver',
])->whereNumber('pago');

/*
|--------------------------------------------------------------------------
| Facturas
|--------------------------------------------------------------------------
*/

Route::get('/facturas', [
    FacturaController::class,
    'index',
])->middleware([
    'auth:sanctum',
    'permiso:facturas.ver',
]);

Route::post('/facturas', [
    FacturaController::class,
    'store',
])->middleware([
    'auth:sanctum',
    'permiso:facturas.generar',
]);

Route::get('/facturas/{factura}', [
    FacturaController::class,
    'show',
])->middleware([
    'auth:sanctum',
    'permiso:facturas.ver',
])->whereNumber('factura');

/*
|--------------------------------------------------------------------------
| Tickets
|--------------------------------------------------------------------------
*/

Route::get('/tickets', [
    TicketController::class,
    'index',
])->middleware([
    'auth:sanctum',
    'permiso:tickets.ver',
]);

Route::post('/tickets', [
    TicketController::class,
    'store',
])->middleware([
    'auth:sanctum',
    'permiso:tickets.generar',
]);

Route::post('/tickets/validar', [
    TicketController::class,
    'validar',
])->middleware([
    'auth:sanctum',
    'permiso:tickets.validar',
]);

Route::get('/tickets/{ticket}', [
    TicketController::class,
    'show',
])->middleware([
    'auth:sanctum',
    'permiso:tickets.ver',
])->whereNumber('ticket');

/*
|--------------------------------------------------------------------------
| Notificaciones
|--------------------------------------------------------------------------
*/

Route::get('/notificaciones', [
    NotificacionController::class,
    'index',
])->middleware([
    'auth:sanctum',
    'permiso:notificaciones.ver',
]);

Route::post('/notificaciones/procesar', [
    NotificacionController::class,
    'procesar',
])->middleware([
    'auth:sanctum',
    'permiso:notificaciones.procesar',
]);

Route::get('/notificaciones/{notificacion}', [
    NotificacionController::class,
    'show',
])->middleware([
    'auth:sanctum',
    'permiso:notificaciones.ver',
])->whereNumber('notificacion');