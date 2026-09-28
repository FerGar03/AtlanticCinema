<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ActualizarFacturacionVentaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tipo_facturacion' => [
                'required',
                'string',
                Rule::in([
                    'CF',
                    'NIT',
                ]),
            ],

            'nit' => [
                'nullable',
                'string',
                'max:20',
                'required_if:tipo_facturacion,NIT',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'tipo_facturacion.required' =>
                'Debe seleccionar el tipo de facturación.',

            'tipo_facturacion.string' =>
                'El tipo de facturación no es válido.',

            'tipo_facturacion.in' =>
                'El tipo de facturación seleccionado no es válido.',

            'nit.required_if' =>
                'Debe ingresar el NIT para solicitar factura con NIT.',

            'nit.string' =>
                'El NIT debe ser un texto válido.',

            'nit.max' =>
                'El NIT no puede superar los 20 caracteres.',
        ];
    }
}