<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:3|confirmed',
        ];
    }
    public function messages(): array
    {
        return [
            'token.required' => 'Token reset password wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Email harus berupa alamat email yang valid.',
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => 'Password baru minimal 3 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
        ];
    }
}