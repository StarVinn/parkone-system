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
                'location_name' => 'SMK Taruna Bhakti Depok',
                'vehicle_type_name' => 'Motor',
                'rate_type' => 'flat',
                'rate_per_hour' => null,
                'first_hour_rate' => null,
                'next_hour_rate' => null,
                'grace_minutes' => 5,
                'flat_rate' => 2000,
            ],
            [
                'location_name' => 'SMK Taruna Bhakti Depok',
                'vehicle_type_name' => 'Mobil',
                'rate_type' => 'flat',
                'rate_per_hour' => null,
                'first_hour_rate' => null,
                'next_hour_rate' => null,
                'grace_minutes' => 5,
                'flat_rate' => 5000,
            ],
            [
                'location_name' => 'Mall Cibinong City Mall',
                'vehicle_type_name' => 'Mobil',
                'rate_type' => 'hourly',
                'rate_per_hour' => 5000,
                'first_hour_rate' => 5000,
                'next_hour_rate' => 5000,
                'grace_minutes' => 5,
                'flat_rate' => null,
            ],
            [
                'location_name' => 'Mall Cibinong City Mall',
                'vehicle_type_name' => 'Motor',
                'rate_type' => 'hourly',
                'rate_per_hour' => 4000,
                'first_hour_rate' => 4000,
                'next_hour_rate' => 4000,
                'grace_minutes' => 5,
                'flat_rate' => null,
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
                    'first_hour_rate' => $rate['first_hour_rate'] ?? $rate['rate_per_hour'],
                    'next_hour_rate' => $rate['next_hour_rate'] ?? $rate['rate_per_hour'],
                    'grace_minutes' => $rate['grace_minutes'] ?? 0,
                    'flat_rate' => $rate['flat_rate'],
                ]
            );
        }
    }
}
