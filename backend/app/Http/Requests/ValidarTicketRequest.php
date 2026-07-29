<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ValidarTicketRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'token_validacion' => [
                'required',
                'string',
                'size:64',
            ],
        ];
    }

    /**
     * Mensajes personalizados.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'token_validacion.required' =>
                'El token de validación es obligatorio.',

            'token_validacion.string' =>
                'El token de validación debe ser una cadena de texto.',

            'token_validacion.size' =>
                'El token de validación debe contener exactamente 64 caracteres.',
        ];
    }
}