<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminStoreAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|min:2|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'role' => 'required|in:admin,officer,owner',
            'rfid_uid' => 'nullable|string|max:255|unique:users,rfid_uid',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi.',
            'name.min' => 'Nama minimal 2 karakter.',
            'name.max' => 'Nama maksimal 255 karakter.',

            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.max' => 'Email maksimal 255 karakter.',
            'email.unique' => 'Email sudah digunakan.',

            'role.required' => 'Role wajib dipilih.',
            'role.in' => 'Role tidak valid.',

            'rfid_uid.max' => 'RFID UID maksimal 255 karakter.',
            'rfid_uid.unique' => 'RFID UID sudah digunakan.',
        ];
    }
}
