<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ConvertirReservaVentaRequest extends FormRequest
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
            'reserva_id' => [
                'required',
                'integer',
                'exists:reservas,id',
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
            'reserva_id.required' =>
                'La reserva es obligatoria.',

            'reserva_id.integer' =>
                'La reserva seleccionada no es válida.',

            'reserva_id.exists' =>
                'La reserva seleccionada no existe.',
        ];
    }
}