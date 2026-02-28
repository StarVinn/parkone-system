<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\Vehicle;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class VehicleService
{
    public function createVehicle(array $data)
    {
        $data['license_plate'] = strtoupper(trim($data['license_plate']));
        $vehicle = Vehicle::create($data);

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Menambah kendaraan: ' . $vehicle->license_plate,
                'activity_time' => now(),
            ]);
        }

        return $vehicle;
    }

    public function createManyVehicles(array $vehicles): int
    {
        DB::transaction(function () use ($vehicles) {
            foreach ($vehicles as $vehicleData) {
                $this->createVehicle($vehicleData);
            }
        });

        return count($vehicles);
    }

    public function updateVehicle(Vehicle $vehicle, array $data)
    {
        $data['license_plate'] = strtoupper(trim($data['license_plate']));
        $vehicle->update($data);

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Memperbarui kendaraan: ' . $vehicle->license_plate,
                'activity_time' => now(),
            ]);
        }

        return $vehicle;
    }

    public function deleteVehicle(Vehicle $vehicle): void
    {
        $licensePlate = $vehicle->license_plate;
        $vehicle->delete();

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Menghapus kendaraan: ' . $licensePlate,
                'activity_time' => now(),
            ]);
        }
    }
}
