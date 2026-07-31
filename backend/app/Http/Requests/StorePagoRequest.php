<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePagoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'venta_id' => [
                'required',
                'integer',
                'exists:ventas,id',
            ],

            'metodo_pago_id' => [
                'required',
                'integer',
                'exists:metodos_pago,id',
            ],

            'descripcion' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'venta_id.required' => 'La venta es obligatoria.',
            'venta_id.integer' => 'La venta seleccionada no es válida.',
            'venta_id.exists' => 'La venta seleccionada no existe.',

            'metodo_pago_id.required' => 'El método de pago es obligatorio.',
            'metodo_pago_id.integer' => 'El método de pago seleccionado no es válido.',
            'metodo_pago_id.exists' => 'El método de pago seleccionado no existe.',

            'descripcion.string' => 'La descripción debe ser una cadena de texto.',
            'descripcion.max' => 'La descripción no puede exceder los 1000 caracteres.',
        ];
    }
}