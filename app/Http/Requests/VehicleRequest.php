<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VehicleRequest extends FormRequest
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
        $vehicleId = $this->route('id');

        if ($this->isMethod('post') && !$vehicleId) {
            return [
                'vehicles' => 'required|array|min:1',
                'vehicles.*.license_plate' => [
                    'required',
                    'string',
                    'max:20',
                    'distinct',
                    Rule::unique('vehicles', 'license_plate'),
                ],
                'vehicles.*.vehicle_type_id' => 'required|exists:vehicle_types,id',
            ];
        }

        return [
            'license_plate' => [
                'required',
                'string',
                'max:20',
                Rule::unique('vehicles', 'license_plate')->ignore($vehicleId),
            ],
            'vehicle_type_id' => 'required|exists:vehicle_types,id',
        ];
    }

    public function messages(): array
    {
        return [
            'vehicles.required' => 'Data kendaraan wajib diisi.',
            'vehicles.array' => 'Format data kendaraan tidak valid.',
            'vehicles.min' => 'Minimal isi 1 kendaraan.',

            'vehicles.*.license_plate.required' => 'Nomor polisi wajib diisi.',
            'vehicles.*.license_plate.string' => 'Nomor polisi harus berupa teks.',
            'vehicles.*.license_plate.max' => 'Nomor polisi maksimal 20 karakter.',
            'vehicles.*.license_plate.distinct' => 'Nomor polisi tidak boleh duplikat dalam form.',
            'vehicles.*.license_plate.unique' => 'Nomor polisi sudah terdaftar.',
            'vehicles.*.vehicle_type_id.required' => 'Tipe kendaraan wajib dipilih.',
            'vehicles.*.vehicle_type_id.exists' => 'Tipe kendaraan tidak valid.',

            'license_plate.required' => 'Nomor polisi wajib diisi.',
            'license_plate.string' => 'Nomor polisi harus berupa teks.',
            'license_plate.max' => 'Nomor polisi maksimal 20 karakter.',
            'license_plate.unique' => 'Nomor polisi sudah terdaftar.',
            'vehicle_type_id.required' => 'Tipe kendaraan wajib dipilih.',
            'vehicle_type_id.exists' => 'Tipe kendaraan tidak valid.',
        ];
    }
}
