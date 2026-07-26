<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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

            'proveedor' => [
                'nullable',
                'string',
                'max:100',
            ],

            'referencia_proveedor' => [
                'nullable',
                'string',
                'max:255',
            ],

            'monto' => [
                'required',
                'numeric',
                'gt:0',
                'decimal:0,2',
            ],

            'moneda' => [
                'nullable',
                'string',
                'max:10',
                Rule::in(['GTQ']),
            ],

            'estado' => [
                'nullable',
                'string',
                Rule::in([
                    'PENDIENTE',
                    'APROBADO',
                    'RECHAZADO',
                    'ANULADO',
                    'REEMBOLSADO',
                ]),
            ],

            'autorizacion_codigo' => [
                'nullable',
                'string',
                'max:255',
            ],

            'descripcion' => [
                'nullable',
                'string',
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

            'proveedor.string' => 'El proveedor debe ser una cadena de texto.',
            'proveedor.max' => 'El proveedor no puede exceder los 100 caracteres.',

            'referencia_proveedor.string' => 'La referencia del proveedor debe ser una cadena de texto.',
            'referencia_proveedor.max' => 'La referencia del proveedor no puede exceder los 255 caracteres.',

            'monto.required' => 'El monto es obligatorio.',
            'monto.numeric' => 'El monto debe ser un valor numérico.',
            'monto.gt' => 'El monto debe ser mayor que cero.',
            'monto.decimal' => 'El monto puede tener un máximo de dos decimales.',

            'moneda.string' => 'La moneda debe ser una cadena de texto.',
            'moneda.max' => 'La moneda no puede exceder los 10 caracteres.',
            'moneda.in' => 'La única moneda permitida actualmente es GTQ.',

            'estado.string' => 'El estado debe ser una cadena de texto.',
            'estado.in' => 'El estado seleccionado no es válido.',

            'autorizacion_codigo.string' => 'El código de autorización debe ser una cadena de texto.',
            'autorizacion_codigo.max' => 'El código de autorización no puede exceder los 255 caracteres.',

            'descripcion.string' => 'La descripción debe ser una cadena de texto.',
        ];
    }
}