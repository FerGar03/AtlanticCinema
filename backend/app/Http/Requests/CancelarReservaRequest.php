<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CancelarReservaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motivo_cancelacion' => [
                'required',
                'string',
                'min:5',
                'max:500',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'motivo_cancelacion.required' =>
                'Debe indicar el motivo de la cancelación.',

            'motivo_cancelacion.min' =>
                'El motivo de cancelación debe tener al menos 5 caracteres.',

            'motivo_cancelacion.max' =>
                'El motivo de cancelación no puede superar los 500 caracteres.',
        ];
    }
}