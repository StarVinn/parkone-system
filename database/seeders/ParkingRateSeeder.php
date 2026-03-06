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
                'location_name' => 'ParkOne Pusat',
                'vehicle_type_name' => 'Motor',
                'rate_type' => 'hourly',
                'rate_per_hour' => 3000,
                'flat_rate' => null,
            ],
            [
                'location_name' => 'ParkOne Pusat',
                'vehicle_type_name' => 'Mobil',
                'rate_type' => 'hourly',
                'rate_per_hour' => 5000,
                'flat_rate' => null,
            ],
            [
                'location_name' => 'ParkOne Pusat',
                'vehicle_type_name' => 'Truk',
                'rate_type' => 'flat',
                'rate_per_hour' => null,
                'flat_rate' => 15000,
            ],
            [
                'location_name' => 'ParkOne Utara',
                'vehicle_type_name' => 'Motor',
                'rate_type' => 'hourly',
                'rate_per_hour' => 2000,
                'flat_rate' => null,
            ],
            [
                'location_name' => 'ParkOne Utara',
                'vehicle_type_name' => 'Mobil',
                'rate_type' => 'hourly',
                'rate_per_hour' => 4000,
                'flat_rate' => null,
            ],
            [
                'location_name' => 'ParkOne Utara',
                'vehicle_type_name' => 'Truk',
                'rate_type' => 'flat',
                'rate_per_hour' => null,
                'flat_rate' => 12000,
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
