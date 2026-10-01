<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFuncionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pelicula_id' => [
                'required',
                'integer',
                Rule::exists('peliculas', 'id')
                    ->whereNull('deleted_at')
                    ->where('estado', 'ACTIVA'),
            ],

            'sala_id' => [
                'required',
                'integer',
                Rule::exists('salas', 'id')
                    ->whereNull('deleted_at')
                    ->where('estado', 'ACTIVA'),
            ],

            'formato_id' => [
                'required',
                'integer',
                Rule::exists('formatos', 'id')
                    ->where('estado', 'ACTIVO'),
            ],

            'inicia_en' => [
                'required',
                'date',
                'after_or_equal:now',
            ],

            'estado' => [
                'required',
                'string',
                Rule::in([
                    'PROGRAMADA',
                    'ACTIVA',
                    'FINALIZADA',
                    'CANCELADA',
                ]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'pelicula_id.required' =>
                'Debe seleccionar una película.',

            'pelicula_id.integer' =>
                'La película seleccionada no es válida.',

            'pelicula_id.exists' =>
                'La película seleccionada no existe o no está activa.',

            'sala_id.required' =>
                'Debe seleccionar una sala.',

            'sala_id.integer' =>
                'La sala seleccionada no es válida.',

            'sala_id.exists' =>
                'La sala seleccionada no existe o no está activa.',

            'formato_id.required' =>
                'Debe seleccionar un formato.',

            'formato_id.integer' =>
                'El formato seleccionado no es válido.',

            'formato_id.exists' =>
                'El formato seleccionado no existe o no está activo.',

            'inicia_en.required' =>
                'Debe indicar la fecha y hora de inicio.',

            'inicia_en.date' =>
                'La fecha y hora de inicio no es válida.',

            'inicia_en.after_or_equal' =>
                'La función no puede iniciar en una fecha pasada.',

            'estado.required' =>
                'Debe indicar el estado de la función.',

            'estado.string' =>
                'El estado de la función no es válido.',

            'estado.in' =>
                'El estado seleccionado no está permitido.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'estado' => is_string(
                $this->estado
            )
                ? strtoupper(
                    trim(
                        $this->estado
                    )
                )
                : $this->estado,
        ]);
    }
}