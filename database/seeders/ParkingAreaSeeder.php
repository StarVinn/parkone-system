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
                'ticket_penalty' => 10000,
            ],
            [
                'location_name' => 'ParkOne Pusat',
                'name' => 'Basement B',
                'capacity' => 100,
                'ticket_penalty' => 12000,
            ],
            [
                'location_name' => 'ParkOne Utara',
                'name' => 'Outdoor A',
                'capacity' => 80,
                'ticket_penalty' => 8000,
            ],
            [
                'location_name' => 'ParkOne Utara',
                'name' => 'Outdoor B',
                'capacity' => 60,
                'ticket_penalty' => 9000,
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
                    'ticket_penalty' => $area['ticket_penalty'] ?? 10000,
                ]
            );
        }
    }
}
