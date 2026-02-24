<?php

namespace App\Services;

use App\Models\ParkingLocation;

class ParkingLocationService
{
    /**
     * Create a new class instance.
     */
    public function createParkingLocation(array $data)
    {
        return ParkingLocation::create($data);
    }
    public function updateParkingLocation(ParkingLocation $parkingLocation, array $data)
    {
        $parkingLocation->update($data);
        return $parkingLocation;
    }
    
}
