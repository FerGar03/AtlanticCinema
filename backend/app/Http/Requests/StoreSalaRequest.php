<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSalaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => [
                'required',
                'string',
                'max:100',
                Rule::unique('salas', 'nombre'),
            ],

            'descripcion' => [
                'nullable',
                'string',
            ],

            'estado' => [
                'sometimes',
                'required',
                Rule::in([
                    'ACTIVA',
                    'INACTIVA',
                    'MANTENIMIENTO',
                ]),
            ],

            'filas' => [
                'required',
                'array',
                'min:1',
            ],

            'filas.*.fila' => [
                'required',
                'string',
                'distinct',
            ],

            'filas.*.cantidad' => [
                'required',
                'integer',
                'min:1',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' =>
                'El nombre de la sala es obligatorio.',

            'nombre.max' =>
                'El nombre no puede superar los 100 caracteres.',

            'nombre.unique' =>
                'Ya existe una sala con ese nombre.',

            'estado.required' =>
                'Debe indicar el estado de la sala.',

            'estado.in' =>
                'El estado debe ser ACTIVA, INACTIVA o MANTENIMIENTO.',

            'filas.required' =>
                'Debe configurar las filas de la sala.',

            'filas.array' =>
                'Las filas deben enviarse como una lista.',

            'filas.min' =>
                'Debe configurar al menos una fila de asientos.',

            'filas.*.fila.required' =>
                'Debe indicar el nombre de cada fila.',

            'filas.*.fila.distinct' =>
                'No puede existir la misma fila más de una vez.',

            'filas.*.cantidad.required' =>
                'Debe indicar la cantidad de asientos de cada fila.',

            'filas.*.cantidad.integer' =>
                'La cantidad de asientos debe ser un número entero.',

            'filas.*.cantidad.min' =>
                'Cada fila debe contener al menos un asiento.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $datos = [];

        if ($this->has('estado')) {
            $datos['estado'] =
                is_string($this->estado)
                    ? strtoupper(trim($this->estado))
                    : $this->estado;
        }

        if ($this->has('filas') && is_array($this->filas)) {
            $datos['filas'] =
                collect($this->filas)
                    ->map(
                        function ($fila): mixed {
                            if (! is_array($fila)) {
                                return $fila;
                            }

                            if (
                                isset($fila['fila'])
                                && is_string($fila['fila'])
                            ) {
                                $fila['fila'] =
                                    strtoupper(
                                        trim($fila['fila'])
                                    );
                            }

                            return $fila;
                        }
                    )
                    ->values()
                    ->all();
        }

        if ($datos !== []) {
            $this->merge($datos);
        }
    }
}