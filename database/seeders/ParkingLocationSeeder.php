<?php

namespace Database\Seeders;

use App\Models\ParkingLocation;
use Illuminate\Database\Seeder;

class ParkingLocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            [
                'name' => 'ParkOne Pusat',
                'latitude' => '-6.200000',
                'longitude' => '106.816666',
                'description' => 'Lokasi utama area parkir pusat kota',
            ],
            [
                'name' => 'ParkOne Utara',
                'latitude' => '-6.138000',
                'longitude' => '106.860000',
                'description' => 'Lokasi parkir cabang utara',
            ],
        ];

        foreach ($locations as $location) {
            ParkingLocation::updateOrCreate(
                ['name' => $location['name']],
                $location
            );
        }
    }
}
