<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePeliculaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'clasificacion_id' => [
                'required',
                'integer',
                'exists:clasificaciones,id',
            ],

            'titulo' => [
                'required',
                'string',
                'max:255',
            ],

            'titulo_original' => [
                'nullable',
                'string',
                'max:255',
            ],

            'sinopsis' => [
                'required',
                'string',
            ],

            'duracion_minutos' => [
                'required',
                'integer',
                'min:1',
            ],

            'fecha_estreno' => [
                'nullable',
                'date',
            ],

            'imagen_url' => [
                'required',
                'string',
                'max:500',
            ],

            'estado' => [
                'sometimes',
                Rule::in([
                    'ACTIVA',
                    'INACTIVA',
                ]),
            ],

            'genero_ids' => [
                'sometimes',
                'array',
            ],

            'genero_ids.*' => [
                'integer',
                'distinct',
                'exists:generos,id',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'clasificacion_id.required' =>
                'Debe seleccionar una clasificación.',

            'clasificacion_id.exists' =>
                'La clasificación seleccionada no existe.',

            'titulo.required' =>
                'El título de la película es obligatorio.',

            'titulo.max' =>
                'El título no puede superar los 255 caracteres.',

            'titulo_original.max' =>
                'El título original no puede superar los 255 caracteres.',

            'sinopsis.required' =>
                'La sinopsis es obligatoria.',

            'duracion_minutos.required' =>
                'La duración de la película es obligatoria.',

            'duracion_minutos.integer' =>
                'La duración debe expresarse en minutos.',

            'duracion_minutos.min' =>
                'La duración debe ser mayor que cero.',

            'fecha_estreno.date' =>
                'La fecha de estreno no es válida.',

            'imagen_url.required' =>
                'La URL de la imagen es obligatoria.',

            'imagen_url.max' =>
                'La URL de la imagen no puede superar los 500 caracteres.',

            'estado.in' =>
                'El estado debe ser ACTIVA o INACTIVA.',

            'genero_ids.array' =>
                'Los géneros deben enviarse como una lista.',

            'genero_ids.*.exists' =>
                'Uno de los géneros seleccionados no existe.',

            'genero_ids.*.distinct' =>
                'No puede seleccionar el mismo género más de una vez.',
        ];
    }
}