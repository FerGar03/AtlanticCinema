<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUsuarioAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $usuario = $this->route('usuario');

        return [
            'rol_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('roles', 'id')
                    ->where('estado', 'ACTIVO'),
            ],

            'nombres' => [
                'sometimes',
                'required',
                'string',
                'max:100',
            ],

            'apellidos' => [
                'sometimes',
                'required',
                'string',
                'max:100',
            ],

            'correo' => [
                'sometimes',
                'required',
                'email',
                'max:150',
                Rule::unique('usuarios', 'correo')
                    ->ignore($usuario?->id),
            ],

            'password' => [
                'sometimes',
                'nullable',
                'string',
                'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'confirmed',
            ],

            'telefono' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
            ],

            'nit' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
            ],

            'direccion' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'estado' => [
                'sometimes',
                'required',
                Rule::in([
                    'ACTIVO',
                    'INACTIVO',
                    'BLOQUEADO',
                ]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'rol_id.exists' =>
                'El rol seleccionado no existe o está inactivo.',

            'nombres.required' =>
                'Los nombres son obligatorios.',

            'apellidos.required' =>
                'Los apellidos son obligatorios.',

            'correo.email' =>
                'Debe ingresar un correo electrónico válido.',

            'correo.unique' =>
                'Ya existe un usuario registrado con ese correo.',

            'password.min' =>
                'La contraseña debe tener al menos 8 caracteres.',

            'password.regex' =>
                'La contraseña debe incluir al menos una letra mayúscula, una letra minúscula y un número.',

            'password.confirmed' =>
                'La confirmación de contraseña no coincide.',

            'estado.in' =>
                'El estado seleccionado no está permitido.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $datos = [];

        if (
            $this->has('correo')
            && is_string($this->correo)
        ) {
            $datos['correo'] =
                strtolower(trim($this->correo));
        }

        if (
            $this->has('estado')
            && is_string($this->estado)
        ) {
            $datos['estado'] =
                strtoupper(trim($this->estado));
        }

        if (!empty($datos)) {
            $this->merge($datos);
        }
    }
}