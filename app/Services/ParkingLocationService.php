<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\ParkingLocation;
use Illuminate\Support\Facades\Auth;

class ParkingLocationService
{
    /**
     * Create a new class instance.
     */
    public function createParkingLocation(array $data)
    {
        $parkingLocation = ParkingLocation::create($data);

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Menambah lokasi parkir: ' . $parkingLocation->name,
                'activity_time' => now(),
            ]);
        }

        return $parkingLocation;
    }
    public function updateParkingLocation(ParkingLocation $parkingLocation, array $data)
    {
        $parkingLocation->update($data);

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Memperbarui lokasi parkir: ' . $parkingLocation->name,
                'activity_time' => now(),
            ]);
        }

        return $parkingLocation;
    }

    public function deleteParkingLocation(ParkingLocation $parkingLocation): void
    {
        $name = $parkingLocation->name;
        $parkingLocation->delete();

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Menghapus lokasi parkir: ' . $name,
                'activity_time' => now(),
            ]);
        }
    }
}
