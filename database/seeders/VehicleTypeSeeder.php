<?php

namespace Database\Seeders;

use App\Models\VehicleType;
use Illuminate\Database\Seeder;

class VehicleTypeSeeder extends Seeder
{
    public function run(): void
    {
        $vehicleTypes = [
            [
                'name' => 'Motor',
                'description' => 'Kendaraan roda dua',
            ],
            [
                'name' => 'Mobil',
                'description' => 'Kendaraan roda empat',
            ],
            [
                'name' => 'Truk',
                'description' => 'Kendaraan angkut barang',
            ],
        ];

        foreach ($vehicleTypes as $type) {
            VehicleType::updateOrCreate(
                ['name' => $type['name']],
                $type
            );
        }
    }
}
