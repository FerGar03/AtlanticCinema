<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ComprarEntradaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
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
        ];
    }

    public function messages(): array
    {
        return [
            'funcion_id.required' =>
                'La función es obligatoria.',

            'funcion_id.integer' =>
                'La función seleccionada no es válida.',

            'funcion_id.exists' =>
                'La función seleccionada no existe.',

            'funcion_asiento_ids.required' =>
                'Debe seleccionar al menos un asiento.',

            'funcion_asiento_ids.array' =>
                'Los asientos deben enviarse en un arreglo.',

            'funcion_asiento_ids.min' =>
                'Debe seleccionar al menos un asiento.',

            'funcion_asiento_ids.max' =>
                'Solo se pueden comprar hasta cinco asientos por operación.',

            'funcion_asiento_ids.*.integer' =>
                'Cada identificador de asiento debe ser un número entero.',

            'funcion_asiento_ids.*.distinct' =>
                'No puede seleccionar el mismo asiento más de una vez.',

            'funcion_asiento_ids.*.exists' =>
                'Uno o más asientos seleccionados no existen.',
        ];
    }
}