<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|min:2|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:2|confirmed',
            'role' => 'in:admin,user',
            'profile_photo' => 'nullable|image|mimes:png,jpg,heic',
            'rfid_uid' => 'nullable|string|max:255|unique:rfid_cards,uid',
            'is_active' => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi.',
            'name.string' => 'Nama harus berupa teks.',
            'name.min' => 'Nama minimal 2 karakter.',
            'name.max' => 'Nama maksimal 255 karakter.',

            'email.required' => 'Email wajib diisi.',
            'email.string' => 'Email harus berupa teks.',
            'email.email' => 'Email harus berupa alamat email yang valid.',
            'email.max' => 'Email maksimal 255 karakter.',
            'email.unique' => 'Email sudah digunakan.',

            'password.required' => 'Password wajib diisi.',
            'password.string' => 'Password harus berupa teks.',
            'password.min' => 'Password minimal 2 karakter.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',

            'profile_photo.image' => 'Profile photo harus berupa gambar.',
            'profile_photo.mimes' => 'Profile photo harus berformat png, jpg, atau heic.',

            'rfid_uid.string' => 'RFID UID harus berupa teks.',
            'rfid_uid.max' => 'RFID UID maksimal 255 karakter.',
            'rfid_uid.unique' => 'RFID UID sudah digunakan.',
            'is_active.boolean' => 'Is active harus berupa nilai boolean (true atau false).',
        ];
    }
}
