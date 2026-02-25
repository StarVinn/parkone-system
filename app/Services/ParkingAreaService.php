<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\ParkingArea;
use Illuminate\Support\Facades\Auth;

class ParkingAreaService
{
    /**
     * Create a new class instance.
     */
    public function createParkingArea(array $data){
        $parkingArea = ParkingArea::create($data);

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Menambah area parkir: ' . $parkingArea->name,
                'activity_time' => now(),
            ]);
        }

        return $parkingArea;
    }
    public function updateParkingArea(ParkingArea $parkingArea, array $data){
        $parkingArea->update($data);

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Memperbarui area parkir: ' . $parkingArea->name,
                'activity_time' => now(),
            ]);
        }

        return $parkingArea;
    }

    public function deleteParkingArea(ParkingArea $parkingArea): void
    {
        $name = $parkingArea->name;
        $parkingArea->delete();

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Menghapus area parkir: ' . $name,
                'activity_time' => now(),
            ]);
        }
    }
}
