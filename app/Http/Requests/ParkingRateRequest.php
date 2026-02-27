<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ParkingRateRequest extends FormRequest
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
            'vehicle_type_id' => 'required|exists:vehicle_types,id',
            'location_id' => 'required|exists:parking_locations,id',
            'rate_type' => 'required|in:hourly,flat',
            'rate_per_hour' => 'required_if:rate_type,hourly|nullable|numeric|min:0',
            'flat_rate' => 'required_if:rate_type,flat|nullable|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'vehicle_type_id.required' => 'Tipe kendaraan wajib diisi.',
            'vehicle_type_id.exists' => 'Tipe kendaraan tidak valid.',
            'location_id.required' => 'Lokasi parkir wajib diisi.',
            'location_id.exists' => 'Lokasi parkir tidak valid.',
            'rate_type.required' => 'Tipe tarif wajib diisi.',
            'rate_type.in' => 'Tipe tarif harus berupa "hourly" atau "flat".',
            'rate_per_hour.required_if' => 'Tarif per jam wajib diisi jika tipe tarif adalah "hourly".',
            'rate_per_hour.numeric' => 'Tarif per jam harus berupa angka.',
            'rate_per_hour.min' => 'Tarif per jam minimal 0 Rupiah.',
            'flat_rate.required_if' => 'Tarif flat wajib diisi jika tipe tarif adalah "flat".',
            'flat_rate.numeric' => 'Tarif flat harus berupa angka.',
            'flat_rate.min' => 'Tarif flat minimal 0 Rupiah.',
        ];
    }
}
