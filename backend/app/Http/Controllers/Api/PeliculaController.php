<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePeliculaRequest;
use App\Http\Requests\UpdatePeliculaRequest;
use App\Models\Pelicula;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PeliculaController extends Controller
{
    public function index(): JsonResponse
    {
        $peliculas = Pelicula::query()
            ->with([
                'clasificacion',
                'generos',
            ])
            ->orderBy('titulo')
            ->get();

        return response()->json([
            'data' => $peliculas,
        ]);
    }

    public function store(
        StorePeliculaRequest $request
    ): JsonResponse {
        $datos = $request->validated();

        $generoIds = $datos['genero_ids'] ?? [];

        unset($datos['genero_ids']);

        $pelicula = DB::transaction(
            function () use (
                $datos,
                $generoIds
            ): Pelicula {
                $pelicula = Pelicula::create([
                    ...$datos,
                    'estado' => $datos['estado'] ?? 'ACTIVA',
                ]);

                if (!empty($generoIds)) {
                    $pelicula
                        ->generos()
                        ->sync($generoIds);
                }

                return $pelicula;
            }
        );

        $pelicula->load([
            'clasificacion',
            'generos',
        ]);

        return response()->json([
            'message' =>
                'Película registrada correctamente.',
            'data' => $pelicula,
        ], 201);
    }

    public function show(
        Pelicula $pelicula
    ): JsonResponse {
        $pelicula->load([
            'clasificacion',
            'generos',
        ]);

        return response()->json([
            'data' => $pelicula,
        ]);
    }

    public function update(
        UpdatePeliculaRequest $request,
        Pelicula $pelicula
    ): JsonResponse {
        $datos = $request->validated();

        $actualizarGeneros =
            array_key_exists('genero_ids', $datos);

        $generoIds =
            $datos['genero_ids'] ?? [];

        unset($datos['genero_ids']);

        DB::transaction(
            function () use (
                $pelicula,
                $datos,
                $actualizarGeneros,
                $generoIds
            ): void {
                if (!empty($datos)) {
                    $pelicula->update($datos);
                }

                if ($actualizarGeneros) {
                    $pelicula
                        ->generos()
                        ->sync($generoIds);
                }
            }
        );

        $pelicula->refresh();

        $pelicula->load([
            'clasificacion',
            'generos',
        ]);

        return response()->json([
            'message' =>
                'Película actualizada correctamente.',
            'data' => $pelicula,
        ]);
    }

    public function destroy(
        Pelicula $pelicula
    ): JsonResponse {
        if ($pelicula->funciones()->exists()) {
            return response()->json([
                'message' =>
                    'La película no puede eliminarse porque tiene funciones asociadas. Puede marcarla como INACTIVA.',
            ], 422);
        }

        $pelicula->delete();

        return response()->json([
            'message' =>
                'Película eliminada correctamente.',
        ]);
    }
}