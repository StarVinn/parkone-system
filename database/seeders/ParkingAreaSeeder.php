<?php

namespace Database\Seeders;

use App\Models\ParkingArea;
use App\Models\ParkingLocation;
use Illuminate\Database\Seeder;

class ParkingAreaSeeder extends Seeder
{
    public function run(): void
    {
        $areas = [
            [
                'location_name' => 'ParkOne Pusat',
                'name' => 'Basement A',
                'capacity' => 120,
            ],
            [
                'location_name' => 'ParkOne Pusat',
                'name' => 'Basement B',
                'capacity' => 100,
            ],
            [
                'location_name' => 'ParkOne Utara',
                'name' => 'Outdoor A',
                'capacity' => 80,
            ],
            [
                'location_name' => 'ParkOne Utara',
                'name' => 'Outdoor B',
                'capacity' => 60,
            ],
        ];

        foreach ($areas as $area) {
            $location = ParkingLocation::query()
                ->where('name', $area['location_name'])
                ->first();

            if (!$location) {
                continue;
            }

            ParkingArea::updateOrCreate(
                [
                    'parking_location_id' => $location->id,
                    'name' => $area['name'],
                ],
                [
                    'capacity' => $area['capacity'],
                    'occupied' => 0,
                ]
            );
        }
    }
}
