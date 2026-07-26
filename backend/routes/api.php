<?php

use App\Http\Controllers\Api\FuncionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ReservaController;
use App\Http\Controllers\Api\VentaController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/funciones', [FuncionController::class, 'index']);
Route::post('/funciones', [FuncionController::class, 'store']);
Route::get('/funciones/{funcion}', [FuncionController::class, 'show'])
    ->whereNumber('funcion');
Route::get('/reservas', [ReservaController::class, 'index']);
Route::post('/reservas', [ReservaController::class, 'store']);
Route::get('/reservas/{reserva}', [ReservaController::class, 'show']);
Route::get('/ventas', [VentaController::class, 'index']);

Route::post(
    '/ventas/desde-reserva',
    [VentaController::class, 'storeDesdeReserva']
);

Route::get('/ventas/{venta}', [VentaController::class, 'show']);