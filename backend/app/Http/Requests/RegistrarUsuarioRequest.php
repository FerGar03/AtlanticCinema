<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegistrarUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('correo')) {
            $this->merge([
                'correo' => mb_strtolower(trim((string) $this->correo)),
            ]);
        }
    }

    public function rules(): array
    {
        return [
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
                'string',
                'email:rfc',
                'max:150',
                'unique:usuarios,correo',
            ],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers(),
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
            'nombre_dispositivo' => [
                'nullable',
                'string',
                'max:100',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nombres.required' => 'Los nombres son obligatorios.',
            'nombres.max' => 'Los nombres no pueden superar los 100 caracteres.',

            'apellidos.required' => 'Los apellidos son obligatorios.',
            'apellidos.max' => 'Los apellidos no pueden superar los 100 caracteres.',

            'correo.required' => 'El correo electrónico es obligatorio.',
            'correo.email' => 'El correo electrónico no posee un formato válido.',
            'correo.max' => 'El correo electrónico no puede superar los 150 caracteres.',
            'correo.unique' => 'Ya existe un usuario registrado con este correo electrónico.',

            'password.required' => 'La contraseña es obligatoria.',
            'password.confirmed' => 'La confirmación de la contraseña no coincide.',

            'telefono.max' => 'El teléfono no puede superar los 20 caracteres.',
            'nit.max' => 'El NIT no puede superar los 20 caracteres.',
            'direccion.max' => 'La dirección no puede superar los 255 caracteres.',

            'nombre_dispositivo.max' => 'El nombre del dispositivo no puede superar los 100 caracteres.',
        ];
    }
}