<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFacturaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $nitReceptor = strtoupper(
            trim((string) $this->input('nit_receptor', 'CF'))
        );

        if ($nitReceptor === '') {
            $nitReceptor = 'CF';
        }

        $nombreReceptor = trim(
            (string) $this->input('nombre_receptor', '')
        );

        if ($nitReceptor === 'CF' && $nombreReceptor === '') {
            $nombreReceptor = 'Consumidor Final';
        }

        $this->merge([
            'nit_receptor' => $nitReceptor,
            'nombre_receptor' => $nombreReceptor,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'venta_id' => [
                'required',
                'integer',
                'min:1',
            ],
            'nit_receptor' => [
                'required',
                'string',
                'max:20',
                'regex:/^(CF|[0-9K-]+)$/',
            ],
            'nombre_receptor' => [
                'required',
                'string',
                'max:150',
            ],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'venta_id.required' =>
                'La venta es obligatoria.',
            'venta_id.integer' =>
                'La venta debe ser un identificador válido.',
            'venta_id.min' =>
                'La venta debe ser un identificador válido.',

            'nit_receptor.required' =>
                'El NIT del receptor es obligatorio.',
            'nit_receptor.string' =>
                'El NIT del receptor debe ser una cadena de texto.',
            'nit_receptor.max' =>
                'El NIT del receptor no puede exceder 20 caracteres.',
            'nit_receptor.regex' =>
                'El NIT del receptor debe ser CF o contener únicamente números, guiones y la letra K.',

            'nombre_receptor.required' =>
                'El nombre del receptor es obligatorio.',
            'nombre_receptor.string' =>
                'El nombre del receptor debe ser una cadena de texto.',
            'nombre_receptor.max' =>
                'El nombre del receptor no puede exceder 150 caracteres.',
        ];
    }
}