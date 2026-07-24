<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFuncionRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para realizar esta solicitud.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación para crear una función.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
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

            'finaliza_en' => [
                'required',
                'date',
                'after:inicia_en',
            ],

            'precio_base' => [
                'required',
                'numeric',
                'min:0.01',
                'decimal:0,2',
            ],

            'estado' => [
                'required',
                'string',
                Rule::in([
                    'PROGRAMADA',
                    'EN_CURSO',
                    'FINALIZADA',
                    'CANCELADA',
                ]),
            ],
        ];
    }

    /**
     * Mensajes personalizados de validación.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'pelicula_id.required' => 'Debe seleccionar una película.',
            'pelicula_id.integer' => 'La película seleccionada no es válida.',
            'pelicula_id.exists' => 'La película seleccionada no existe o no está activa.',

            'sala_id.required' => 'Debe seleccionar una sala.',
            'sala_id.integer' => 'La sala seleccionada no es válida.',
            'sala_id.exists' => 'La sala seleccionada no existe o no está activa.',

            'formato_id.required' => 'Debe seleccionar un formato.',
            'formato_id.integer' => 'El formato seleccionado no es válido.',
            'formato_id.exists' => 'El formato seleccionado no existe o no está activo.',

            'inicia_en.required' => 'Debe indicar la fecha y hora de inicio.',
            'inicia_en.date' => 'La fecha y hora de inicio no es válida.',
            'inicia_en.after_or_equal' => 'La función no puede iniciar en una fecha pasada.',

            'finaliza_en.required' => 'Debe indicar la fecha y hora de finalización.',
            'finaliza_en.date' => 'La fecha y hora de finalización no es válida.',
            'finaliza_en.after' => 'La finalización debe ser posterior al inicio.',

            'precio_base.required' => 'Debe indicar el precio base.',
            'precio_base.numeric' => 'El precio base debe ser un valor numérico.',
            'precio_base.min' => 'El precio base debe ser mayor que cero.',
            'precio_base.decimal' => 'El precio base puede tener como máximo dos decimales.',

            'estado.required' => 'Debe indicar el estado de la función.',
            'estado.string' => 'El estado de la función no es válido.',
            'estado.in' => 'El estado seleccionado no está permitido.',
        ];
    }

    /**
     * Convierte ciertos datos antes de validarlos.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'estado' => is_string($this->estado)
                ? strtoupper(trim($this->estado))
                : $this->estado,
        ]);
    }
}