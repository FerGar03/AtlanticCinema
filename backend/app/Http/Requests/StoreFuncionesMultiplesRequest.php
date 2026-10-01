<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreFuncionesMultiplesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'pelicula_id' => [
                'required',
                'integer',
                Rule::exists('peliculas', 'id')
                    ->whereNull('deleted_at')
                    ->where('estado', 'ACTIVA'),
            ],

            'sala_id' => [
                'required',
                'integer',
                Rule::exists('salas', 'id')
                    ->whereNull('deleted_at')
                    ->where('estado', 'ACTIVA'),
            ],

            'formato_id' => [
                'required',
                'integer',
                Rule::exists('formatos', 'id')
                    ->where('estado', 'ACTIVO'),
            ],

            'fecha_inicio' => [
                'required',
                'date',
                'after_or_equal:today',
            ],

            'fecha_fin' => [
                'required',
                'date',
                'after_or_equal:fecha_inicio',
            ],

            'hora_inicio' => [
                'required',
                'date_format:H:i',
            ],

            'dias' => [
                'required',
                'array',
                'min:1',
            ],

            'dias.*' => [
                'required',
                'integer',
                'distinct',
                Rule::in([
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                    7,
                ]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'pelicula_id.required' =>
                'Debe seleccionar una película.',

            'pelicula_id.exists' =>
                'La película seleccionada no existe o no está activa.',

            'sala_id.required' =>
                'Debe seleccionar una sala.',

            'sala_id.exists' =>
                'La sala seleccionada no existe o no está activa.',

            'formato_id.required' =>
                'Debe seleccionar un formato.',

            'formato_id.exists' =>
                'El formato seleccionado no existe o no está activo.',

            'fecha_inicio.required' =>
                'Debe indicar la fecha inicial.',

            'fecha_inicio.after_or_equal' =>
                'La fecha inicial no puede estar en el pasado.',

            'fecha_fin.required' =>
                'Debe indicar la fecha final.',

            'fecha_fin.after_or_equal' =>
                'La fecha final debe ser igual o posterior a la fecha inicial.',

            'hora_inicio.required' =>
                'Debe indicar la hora de inicio.',

            'hora_inicio.date_format' =>
                'La hora de inicio no tiene un formato válido.',

            'dias.required' =>
                'Debe seleccionar al menos un día de la semana.',

            'dias.min' =>
                'Debe seleccionar al menos un día de la semana.',

            'dias.*.in' =>
                'Uno de los días seleccionados no es válido.',
        ];
    }

    public function after(): array
    {
        return [
            function (
                Validator $validator
            ): void {
                if (
                    ! $this->fecha_inicio
                    || ! $this->fecha_fin
                ) {
                    return;
                }

                try {
                    $inicio =
                        Carbon::parse(
                            $this->fecha_inicio
                        )
                            ->startOfDay();

                    $fin =
                        Carbon::parse(
                            $this->fecha_fin
                        )
                            ->startOfDay();

                    if (
                        $inicio
                            ->diffInDays(
                                $fin
                            )
                        > 62
                    ) {
                        $validator
                            ->errors()
                            ->add(
                                'fecha_fin',
                                'El rango no puede superar 63 días.'
                            );
                    }
                } catch (\Throwable) {
                    /*
                     * Las reglas date se
                     * encargan del error.
                     */
                }
            },
        ];
    }
}