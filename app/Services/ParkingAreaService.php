<?php

namespace App\Services;

use App\Models\ParkingArea;

class ParkingAreaService
{
    /**
     * Create a new class instance.
     */
    public function createParkingArea(array $data){
        
        return ParkingArea::create($data);
    }
    public function updateParkingArea(ParkingArea $parkingArea, array $data){
        $parkingArea->update($data);
        return $parkingArea;
    }
}
