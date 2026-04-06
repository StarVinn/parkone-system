<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\ParkingRate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ParkingRateService
{
    /**
     * Create a new class instance.
     */
    public function createParkingRate(array $data){
        $parkingRate = DB::transaction(function () use ($data) {
            return ParkingRate::create([
                ...$data,
                'pricing_rule_key' => (string) Str::uuid(),
                'version_number' => 1,
                'is_current' => true,
            ]);
        });

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
        $parkingRate = DB::transaction(function () use ($parkingRate, $data) {
            $parkingRate->forceFill([
                'is_current' => false,
            ])->save();

            return ParkingRate::create([
                ...$data,
                'location_id' => $parkingRate->location_id,
                'vehicle_type_id' => $parkingRate->vehicle_type_id,
                'pricing_rule_key' => $parkingRate->pricing_rule_key ?: (string) Str::uuid(),
                'version_number' => ((int) $parkingRate->version_number) + 1,
                'is_current' => true,
            ]);
        });

        if (Auth::id()) {
            ActivityLog::create([
                'user_id' => Auth::id(),
                'activity' => 'Memperbarui tarif kendaraan ID ' . $parkingRate->id . ' ke versi ' . $parkingRate->version_number,
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
