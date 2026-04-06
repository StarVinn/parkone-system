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
                'description' => 'Kendaraan roda dua untuk siswa, guru, dan staf sekolah',
            ],
            [
                'name' => 'Mobil',
                'description' => 'Kendaraan roda empat untuk guru, tamu, dan operasional sekolah',
            ],
            [
                'name' => 'Bus',
                'description' => 'Bus sekolah untuk antar jemput siswa dan kegiatan sekolah',
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
