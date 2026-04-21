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
            'first_hour_rate' => 'required_if:rate_type,hourly|nullable|numeric|min:0',
            'next_hour_rate' => 'required_if:rate_type,hourly|nullable|numeric|min:0',
            'grace_minutes' => 'nullable|integer|min:0|max:120',
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
            'first_hour_rate.required_if' => 'Tarif jam pertama wajib diisi jika tipe tarif adalah "hourly".',
            'first_hour_rate.numeric' => 'Tarif jam pertama harus berupa angka.',
            'first_hour_rate.min' => 'Tarif jam pertama minimal 0 Rupiah.',
            'next_hour_rate.required_if' => 'Tarif jam berikutnya wajib diisi jika tipe tarif adalah "hourly".',
            'next_hour_rate.numeric' => 'Tarif jam berikutnya harus berupa angka.',
            'next_hour_rate.min' => 'Tarif jam berikutnya minimal 0 Rupiah.',
            'grace_minutes.integer' => 'Grace period harus berupa angka menit.',
            'grace_minutes.min' => 'Grace period minimal 0 menit.',
            'grace_minutes.max' => 'Grace period maksimal 120 menit.',
            'flat_rate.required_if' => 'Tarif flat wajib diisi jika tipe tarif adalah "flat".',
            'flat_rate.numeric' => 'Tarif flat harus berupa angka.',
            'flat_rate.min' => 'Tarif flat minimal 0 Rupiah.',
        ];
    }
}
