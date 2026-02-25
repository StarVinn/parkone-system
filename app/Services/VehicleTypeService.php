<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\VehicleType;
use Illuminate\Support\Facades\Auth;

class VehicleTypeService
{
    public function createVehicleType(array $data)
    {
        $vehicleType = VehicleType::create($data);

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Menambah tipe kendaraan: ' . $vehicleType->name,
                'activity_time' => now(),
            ]);
        }

        return $vehicleType;
    }
    public function updateVehicleType(VehicleType $vehicleType, array $data)
    {
        $vehicleType->update($data);

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Memperbarui tipe kendaraan: ' . $vehicleType->name,
                'activity_time' => now(),
            ]);
        }

        return $vehicleType;
    }

    public function deleteVehicleType(VehicleType $vehicleType): void
    {
        $name = $vehicleType->name;
        $vehicleType->delete();

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Menghapus tipe kendaraan: ' . $name,
                'activity_time' => now(),
            ]);
        }
    }
}
