<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ParkingAreaRequest extends FormRequest
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
            'parking_location_id' => 'required|exists:parking_locations,id',
            'capacity' => 'required|integer|min:1',
            'ticket_penalty' => 'required|integer|min:0',
        ];
    }
    public function messages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi.',
            'name.string' => 'Nama harus berupa teks.',
            'name.min' => 'Nama minimal 2 karakter.',
            'name.max' => 'Nama maksimal 255 karakter.',

            'parking_location_id.required' => 'Lokasi wajib dipilih.',
            'parking_location_id.exists' => 'Lokasi tidak valid.',

            'capacity.required' => 'Kapasitas wajib diisi.',
            'capacity.integer' => 'Kapasitas harus berupa angka.',
            'capacity.min' => 'Kapasitas minimal 1.',

            'ticket_penalty.required' => 'Denda tiket wajib diisi.',
            'ticket_penalty.integer' => 'Denda tiket harus berupa angka.',
            'ticket_penalty.min' => 'Denda tiket tidak boleh minus.',
        ];
    }
}
