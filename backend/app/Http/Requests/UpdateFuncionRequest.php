<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFuncionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pelicula_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('peliculas', 'id')
                    ->whereNull('deleted_at')
                    ->where('estado', 'ACTIVA'),
            ],

            'sala_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('salas', 'id')
                    ->whereNull('deleted_at')
                    ->where('estado', 'ACTIVA'),
            ],

            'formato_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('formatos', 'id')
                    ->where('estado', 'ACTIVO'),
            ],

            'inicia_en' => [
                'sometimes',
                'required',
                'date',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'pelicula_id.integer' =>
                'La película seleccionada no es válida.',

            'pelicula_id.exists' =>
                'La película seleccionada no existe o no está activa.',

            'sala_id.integer' =>
                'La sala seleccionada no es válida.',

            'sala_id.exists' =>
                'La sala seleccionada no existe o no está activa.',

            'formato_id.integer' =>
                'El formato seleccionado no es válido.',

            'formato_id.exists' =>
                'El formato seleccionado no existe o no está activo.',

            'inicia_en.date' =>
                'La fecha y hora de inicio no es válida.',
        ];
    }
}