<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransactionRequest extends FormRequest
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
            'action' => 'required|in:entry,exit',
            'license_plate' => [
                'required',
                'string',
                'max:20',
                'regex:/^[A-Za-z]{1,2}\s?[0-9]{1,4}\s?[A-Za-z]{1,3}$/',
            ],
            'parking_area_id' => 'required_if:action,entry|nullable|exists:parking_areas,id',
        ];
    }

    public function messages(): array
    {
        return [
            'action.required' => 'Aksi transaksi wajib dipilih.',
            'action.in' => 'Aksi transaksi tidak valid.',
            'license_plate.required' => 'Plat nomor wajib diisi.',
            'license_plate.string' => 'Plat nomor harus berupa teks.',
            'license_plate.max' => 'Plat nomor maksimal 20 karakter.',
            'license_plate.regex' => 'Format plat harus seperti "D 4512 I" atau "AD 45 ID".',
            'parking_area_id.required_if' => 'Area parkir wajib dipilih untuk kendaraan masuk.',
            'parking_area_id.exists' => 'Area parkir tidak valid.',
        ];
    }
}
