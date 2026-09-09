<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSalaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('salas', 'nombre')
                    ->ignore($this->route('sala')?->id),
            ],

            'descripcion' => [
                'sometimes',
                'nullable',
                'string',
            ],

            'estado' => [
                'sometimes',
                'required',
                Rule::in([
                    'ACTIVA',
                    'INACTIVA',
                    'MANTENIMIENTO',
                ]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' =>
                'El nombre de la sala es obligatorio.',

            'nombre.max' =>
                'El nombre no puede superar los 100 caracteres.',

            'nombre.unique' =>
                'Ya existe una sala con ese nombre.',

            'estado.required' =>
                'Debe indicar el estado de la sala.',

            'estado.in' =>
                'El estado debe ser ACTIVA, INACTIVA o MANTENIMIENTO.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('estado')) {
            $this->merge([
                'estado' => is_string($this->estado)
                    ? strtoupper(trim($this->estado))
                    : $this->estado,
            ]);
        }
    }
}