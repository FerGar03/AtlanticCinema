<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUsuarioAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rol_id' => [
                'required',
                'integer',
                Rule::exists('roles', 'id')
                    ->where('estado', 'ACTIVO'),
            ],

            'nombres' => [
                'required',
                'string',
                'max:100',
            ],

            'apellidos' => [
                'required',
                'string',
                'max:100',
            ],

            'correo' => [
                'required',
                'email',
                'max:150',
                'unique:usuarios,correo',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'confirmed',
            ],

            'telefono' => [
                'nullable',
                'string',
                'max:20',
            ],

            'nit' => [
                'nullable',
                'string',
                'max:20',
            ],

            'direccion' => [
                'nullable',
                'string',
                'max:255',
            ],

            'estado' => [
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
            'rol_id.required' =>
                'Debe seleccionar un rol.',

            'rol_id.exists' =>
                'El rol seleccionado no existe o está inactivo.',

            'nombres.required' =>
                'Los nombres son obligatorios.',

            'apellidos.required' =>
                'Los apellidos son obligatorios.',

            'correo.required' =>
                'El correo electrónico es obligatorio.',

            'correo.email' =>
                'Debe ingresar un correo electrónico válido.',

            'correo.unique' =>
                'Ya existe un usuario registrado con ese correo.',

            'password.required' =>
                'La contraseña es obligatoria.',

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

        if (is_string($this->correo)) {
            $datos['correo'] =
                strtolower(trim($this->correo));
        }

        if (is_string($this->estado)) {
            $datos['estado'] =
                strtoupper(trim($this->estado));
        }

        if (!empty($datos)) {
            $this->merge($datos);
        }
    }
}