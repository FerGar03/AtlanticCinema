<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerarTicketRequest extends FormRequest
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
            'venta_id' => [
                'required',
                'integer',
                'exists:ventas,id',
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
            'venta_id.required' => 'El identificador de la venta es obligatorio.',
            'venta_id.integer' => 'El identificador de la venta debe ser un número entero.',
            'venta_id.exists' => 'La venta indicada no existe.',
        ];
    }
}