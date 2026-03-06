<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminUpdateAccountIdentityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'email' => [
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'rfid_uid' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('users', 'rfid_uid')->ignore($userId),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'email.email' => 'Format email tidak valid.',
            'email.max' => 'Email maksimal 255 karakter.',
            'email.unique' => 'Email sudah digunakan.',
            'rfid_uid.max' => 'RFID UID maksimal 255 karakter.',
            'rfid_uid.unique' => 'RFID UID sudah digunakan.',
        ];
    }
}
