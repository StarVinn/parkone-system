<?php

namespace Database\Seeders;

use App\Models\ParkingLocation;
use App\Models\ParkingRate;
use App\Models\VehicleType;
use Illuminate\Database\Seeder;

class ParkingRateSeeder extends Seeder
{
    public function run(): void
    {
        $rates = [
            [
                'location_name' => 'SMA Nusantara',
                'vehicle_type_name' => 'Motor',
                'rate_type' => 'hourly',
                'rate_per_hour' => 2000,
                'flat_rate' => null,
            ],
            [
                'location_name' => 'SMA Nusantara',
                'vehicle_type_name' => 'Mobil',
                'rate_type' => 'hourly',
                'rate_per_hour' => 3500,
                'flat_rate' => null,
            ],
            [
                'location_name' => 'SMA Nusantara',
                'vehicle_type_name' => 'Bus',
                'rate_type' => 'flat',
                'rate_per_hour' => null,
                'flat_rate' => 10000,
            ],
            [
                'location_name' => 'SMK Bina Karya',
                'vehicle_type_name' => 'Motor',
                'rate_type' => 'hourly',
                'rate_per_hour' => 1500,
                'flat_rate' => null,
            ],
            [
                'location_name' => 'SMK Bina Karya',
                'vehicle_type_name' => 'Mobil',
                'rate_type' => 'hourly',
                'rate_per_hour' => 3000,
                'flat_rate' => null,
            ],
            [
                'location_name' => 'SMK Bina Karya',
                'vehicle_type_name' => 'Bus',
                'rate_type' => 'flat',
                'rate_per_hour' => null,
                'flat_rate' => 8500,
            ],
            [
                'location_name' => 'SMK Taruna Bhakti Depok',
                'vehicle_type_name' => 'Motor',
                'rate_type' => 'flat',
                'rate_per_hour' => null,
                'flat_rate' => 2000,
            ],
            [
                'location_name' => 'SMK Taruna Bhakti Depok',
                'vehicle_type_name' => 'Mobil',
                'rate_type' => 'flat',
                'rate_per_hour' => null,
                'flat_rate' => 5000,
            ],
        ];

        foreach ($rates as $rate) {
            $location = ParkingLocation::query()
                ->where('name', $rate['location_name'])
                ->first();
            $vehicleType = VehicleType::query()
                ->where('name', $rate['vehicle_type_name'])
                ->first();

            if (!$location || !$vehicleType) {
                continue;
            }

            ParkingRate::updateOrCreate(
                [
                    'location_id' => $location->id,
                    'vehicle_type_id' => $vehicleType->id,
                ],
                [
                    'rate_type' => $rate['rate_type'],
                    'rate_per_hour' => $rate['rate_per_hour'],
                    'flat_rate' => $rate['flat_rate'],
                ]
            );
        }
    }
}
