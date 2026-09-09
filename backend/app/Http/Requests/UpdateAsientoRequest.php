<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAsientoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tipo' => [
                'sometimes',
                'required',
                Rule::in([
                    'NORMAL',
                    'PREFERENCIAL',
                    'DISCAPACIDAD',
                ]),
            ],

            'estado' => [
                'sometimes',
                'required',
                Rule::in([
                    'ACTIVO',
                    'INACTIVO',
                ]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'tipo.required' =>
                'Debe indicar el tipo de asiento.',

            'tipo.in' =>
                'El tipo de asiento seleccionado no está permitido.',

            'estado.required' =>
                'Debe indicar el estado del asiento.',

            'estado.in' =>
                'El estado debe ser ACTIVO o INACTIVO.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $datos = [];

        if ($this->has('tipo')) {
            $datos['tipo'] = is_string($this->tipo)
                ? strtoupper(trim($this->tipo))
                : $this->tipo;
        }

        if ($this->has('estado')) {
            $datos['estado'] = is_string($this->estado)
                ? strtoupper(trim($this->estado))
                : $this->estado;
        }

        if (!empty($datos)) {
            $this->merge($datos);
        }
    }
}