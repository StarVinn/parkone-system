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
                'name' => 'SMA Nusantara',
                'latitude' => '-6.201200',
                'longitude' => '106.818900',
                'description' => 'Area parkir utama lingkungan SMA Nusantara',
            ],
            [
                'name' => 'SMK Bina Karya',
                'latitude' => '-6.157300',
                'longitude' => '106.852100',
                'description' => 'Area parkir sekolah kejuruan untuk siswa, guru, dan tamu',
            ],
            [
                'name' => 'SMK Taruna Bhakti Depok',
                'latitude' => '-6.3842636',
                'longitude' => '106.8700270',
                'description' => 'Area parkir lingkungan SMK Taruna Bhakti Depok',
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
