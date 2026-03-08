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
            'vehicle_photo' => 'exclude_unless:action,entry|required_if:action,entry|image|mimes:jpg,jpeg,png,webp|max:4096',
            'checkout_mode' => 'exclude_unless:action,exit|nullable|in:ticket,rfid',
            'rfid_uid' => 'nullable|string|max:255',
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
            'vehicle_photo.required_if' => 'Foto kendaraan wajib diambil untuk kendaraan masuk.',
            'vehicle_photo.image' => 'Foto kendaraan harus berupa gambar.',
            'vehicle_photo.mimes' => 'Format foto kendaraan harus JPG, PNG, atau WEBP.',
            'vehicle_photo.max' => 'Ukuran foto kendaraan maksimal 4 MB.',
            'checkout_mode.in' => 'Mode checkout tidak valid.',
            'rfid_uid.max' => 'RFID UID maksimal 255 karakter.',
        ];
    }
}
