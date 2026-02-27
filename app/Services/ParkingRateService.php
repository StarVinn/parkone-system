<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\ParkingRate;
use Illuminate\Support\Facades\Auth;

class ParkingRateService
{
    /**
     * Create a new class instance.
     */
    public function createParkingRate(array $data){
        $parkingRate = ParkingRate::create($data);

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Menambah tarif kendaraan untuk lokasi ID ' . $parkingRate->location_id,
                'activity_time' => now(),
            ]);
        }

        return $parkingRate;
    }
    public function updateParkingRate(ParkingRate $parkingRate, array $data){
        $parkingRate->update($data);

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Memperbarui tarif kendaraan ID ' . $parkingRate->id,
                'activity_time' => now(),
            ]);
        }

        return $parkingRate;
    }

    public function deleteParkingRate(ParkingRate $parkingRate): void
    {
        $rateId = $parkingRate->id;
        $parkingRate->delete();

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Menghapus tarif kendaraan ID ' . $rateId,
                'activity_time' => now(),
            ]);
        }
    }
}
