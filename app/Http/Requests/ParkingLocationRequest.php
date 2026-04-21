<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class ParkingLocationRequest extends FormRequest
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
            'owner_id' => [
                'nullable',
                'integer',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if ($value === null || $value === '') {
                        return;
                    }

                    $ownerExists = User::query()
                        ->whereKey((int) $value)
                        ->where('role', 'owner')
                        ->exists();

                    if (! $ownerExists) {
                        $fail('Owner yang dipilih tidak valid.');
                    }
                },
            ],
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'description' => 'nullable|string|max:1000',
        ];

    }
    
    public function messages(): array
        {
            return [
                'name.required' => 'Nama wajib diisi.',
                'name.string' => 'Nama harus berupa teks.',
                'name.min' => 'Nama minimal 2 karakter.',
                'name.max' => 'Nama maksimal 255 karakter.',

                'owner_id.integer' => 'Owner tidak valid.',

                'latitude.required' => 'Latitude wajib diisi.',
                'latitude.numeric' => 'Latitude harus berupa angka.',
                'latitude.between' => 'Latitude harus antara -90 dan 90.',

                'longitude.required' => 'Longitude wajib diisi.',
                'longitude.numeric' => 'Longitude harus berupa angka.',
                'longitude.between' => 'Longitude harus antara -180 dan 180.',

                'description.string' => 'Deskripsi harus berupa teks.',
                'description.max' => 'Deskripsi maksimal 1000 karakter.',
            ];
        }
}
