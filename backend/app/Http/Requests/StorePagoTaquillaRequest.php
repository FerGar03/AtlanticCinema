<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePagoTaquillaRequest extends FormRequest
{
    public function authorize(): bool
    {
        $usuario = $this->user();

        return in_array(
            $usuario?->rol?->nombre,
            [
                'Administrador',
                'Empleado',
            ],
            true
        );
    }

    public function rules(): array
    {
        return [
            'venta_id' => [
                'required',
                'integer',
                'exists:ventas,id',
            ],

            'metodo' => [
                'required',
                'string',
                Rule::in([
                    'EFECTIVO',
                    'TARJETA',
                ]),
            ],

            /*
             * EFECTIVO
             */
            'efectivo_recibido' => [
                Rule::requiredIf(
                    fn () =>
                        $this->input('metodo')
                        === 'EFECTIVO'
                ),
                'nullable',
                'numeric',
                'min:0',
            ],

            /*
             * TARJETA POS
             */
            'proveedor_pos' => [
                Rule::requiredIf(
                    fn () =>
                        $this->input('metodo')
                        === 'TARJETA'
                ),
                'nullable',
                'string',
                'max:100',
            ],

            'referencia_proveedor' => [
                'nullable',
                'string',
                'max:150',
            ],

            'autorizacion_codigo' => [
                Rule::requiredIf(
                    fn () =>
                        $this->input('metodo')
                        === 'TARJETA'
                ),
                'nullable',
                'string',
                'max:150',
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
            'venta_id.required' =>
                'La venta es obligatoria.',

            'venta_id.integer' =>
                'La venta seleccionada no es válida.',

            'venta_id.exists' =>
                'La venta seleccionada no existe.',

            'metodo.required' =>
                'Debe seleccionar un método de pago.',

            'metodo.in' =>
                'El método de pago debe ser EFECTIVO o TARJETA.',

            'efectivo_recibido.required' =>
                'Debe indicar cuánto efectivo recibió.',

            'efectivo_recibido.numeric' =>
                'El efectivo recibido debe ser un monto válido.',

            'efectivo_recibido.min' =>
                'El efectivo recibido no puede ser negativo.',

            'proveedor_pos.required' =>
                'Debe indicar el proveedor o POS utilizado.',

            'proveedor_pos.string' =>
                'El proveedor del POS no es válido.',

            'proveedor_pos.max' =>
                'El nombre del proveedor no puede superar los 100 caracteres.',

            'referencia_proveedor.string' =>
                'La referencia del comprobante no es válida.',

            'referencia_proveedor.max' =>
                'La referencia no puede superar los 150 caracteres.',

            'autorizacion_codigo.required' =>
                'Debe ingresar el código de autorización del POS.',

            'autorizacion_codigo.string' =>
                'El código de autorización no es válido.',

            'autorizacion_codigo.max' =>
                'El código de autorización no puede superar los 150 caracteres.',

            'descripcion.string' =>
                'La descripción no es válida.',

            'descripcion.max' =>
                'La descripción no puede superar los 1000 caracteres.',
        ];
    }
}