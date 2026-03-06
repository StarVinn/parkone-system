<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminResetAccountEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => 'required|string|email|max:255|unique:users,email',
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Email baru wajib diisi.',
            'email.email' => 'Format email baru tidak valid.',
            'email.max' => 'Email baru maksimal 255 karakter.',
            'email.unique' => 'Email baru sudah digunakan.',
        ];
    }
}
