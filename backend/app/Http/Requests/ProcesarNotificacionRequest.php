<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcesarNotificacionRequest extends FormRequest
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
            'notificacion_id' => [
                'required',
                'integer',
                'exists:notificaciones,id',
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
            'notificacion_id.required' =>
                'La notificación es obligatoria.',

            'notificacion_id.integer' =>
                'El identificador de la notificación debe ser un número entero.',

            'notificacion_id.exists' =>
                'La notificación indicada no existe.',
        ];
    }
}