<?php

use App\Http\Controllers\Api\FuncionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/funciones', [FuncionController::class, 'index']);
Route::post('/funciones', [FuncionController::class, 'store']);
Route::get('/funciones/{funcion}', [FuncionController::class, 'show'])
    ->whereNumber('funcion');