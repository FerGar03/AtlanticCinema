<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
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
            'correo' => [
                'required',
                'string',
                'email:rfc',
                'max:150',
            ],
            'password' => [
                'required',
                'string',
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
            'correo.required' => 'El correo electrónico es obligatorio.',
            'correo.email' => 'El correo electrónico no posee un formato válido.',
            'correo.max' => 'El correo electrónico no puede superar los 150 caracteres.',

            'password.required' => 'La contraseña es obligatoria.',

            'nombre_dispositivo.max' => 'El nombre del dispositivo no puede superar los 100 caracteres.',
        ];
    }
}