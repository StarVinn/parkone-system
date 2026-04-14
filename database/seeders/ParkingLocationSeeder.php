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
                'name' => 'SMK Taruna Bhakti Depok',
                'latitude' => '-6.3840564426363196',
                'longitude' => '106.86988652309114',
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
