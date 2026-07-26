<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReservaRequest extends FormRequest
{
    /**
     * Determina si el usuario está autorizado para realizar la solicitud.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Reglas de validación de la solicitud.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'usuario_id' => [
                'required',
                'integer',
                'exists:usuarios,id',
            ],

            'funcion_id' => [
                'required',
                'integer',
                'exists:funciones,id',
            ],

            'funcion_asiento_ids' => [
                'required',
                'array',
                'min:1',
                'max:5',
            ],

            'funcion_asiento_ids.*' => [
                'required',
                'integer',
                'distinct',
                'exists:funcion_asientos,id',
            ],

            'descuento' => [
                'nullable',
                'numeric',
                'min:0',
            ],
        ];
    }

    /**
     * Mensajes personalizados de validación.
     */
    public function messages(): array
    {
        return [
            'usuario_id.required' =>
                'El usuario es obligatorio.',

            'usuario_id.integer' =>
                'El identificador del usuario debe ser un número entero.',

            'usuario_id.exists' =>
                'El usuario seleccionado no existe.',

            'funcion_id.required' =>
                'La función es obligatoria.',

            'funcion_id.integer' =>
                'El identificador de la función debe ser un número entero.',

            'funcion_id.exists' =>
                'La función seleccionada no existe.',

            'funcion_asiento_ids.required' =>
                'Debe seleccionar al menos un asiento.',

            'funcion_asiento_ids.array' =>
                'Los asientos deben enviarse en un arreglo.',

            'funcion_asiento_ids.min' =>
                'Debe seleccionar al menos un asiento.',

            'funcion_asiento_ids.max' =>
                'Solo se pueden reservar hasta cinco asientos por operación.',

            'funcion_asiento_ids.*.required' =>
                'Cada asiento seleccionado debe tener un identificador.',

            'funcion_asiento_ids.*.integer' =>
                'Cada identificador de asiento debe ser un número entero.',

            'funcion_asiento_ids.*.distinct' =>
                'No puede seleccionar el mismo asiento más de una vez.',

            'funcion_asiento_ids.*.exists' =>
                'Uno o más asientos seleccionados no existen.',

            'descuento.numeric' =>
                'El descuento debe ser un valor numérico.',

            'descuento.min' =>
                'El descuento no puede ser negativo.',
        ];
    }
}