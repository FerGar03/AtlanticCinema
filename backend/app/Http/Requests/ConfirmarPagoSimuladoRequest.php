<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConfirmarPagoSimuladoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'resultado' => [
                'required',
                'string',
                Rule::in([
                    'APROBADO',
                    'RECHAZADO',
                ]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'resultado.required' => 'El resultado de la simulación es obligatorio.',
            'resultado.string' => 'El resultado de la simulación debe ser texto.',
            'resultado.in' => 'El resultado debe ser APROBADO o RECHAZADO.',
        ];
    }
}