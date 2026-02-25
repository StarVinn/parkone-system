<?php

namespace App\Services;

use App\Models\ParkingRate;

class VehicleRateService
{
    /**
     * Create a new class instance.
     */
    public function createVehicleRate(array $data){
        
        return ParkingRate::create($data);
    }
    public function updateVehicleRate(ParkingRate $parkingRate, array $data){
        $parkingRate->update($data);
        return $parkingRate;
    }
}
