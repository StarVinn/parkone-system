<?php

namespace App\Services;

use App\Models\VehicleType;

class VehicleTypeService
{
    public function createVehicleType(array $data)
    {
        return VehicleType::create($data);
    }
    public function updateVehicleType(VehicleType $vehicleType, array $data)
    {
        $vehicleType->update($data);
        return $vehicleType;
    }
}
