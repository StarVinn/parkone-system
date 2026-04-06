<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DashboardResource;
use App\Models\ParkingLocation;
use App\Models\Transaction;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $user->loadMissing(['rfidCards', 'primaryRfidCard']);

        $parkingLocations = ParkingLocation::query()
            ->with(['areas'])
            ->orderBy('name')
            ->get();

        $activeTransactions = Transaction::query()
            ->with([
                'user:id,name,email,role,rfid_uid,is_active,status',
                'vehicle.vehicleType',
                'parkingArea.location',
                'parkingRate.location',
                'parkingRate.vehicleType',
                'rfidCard.vehicle',
            ])
            ->where('status', 'active')
            ->whereHas('user.primaryRfidCard')
            ->latest('entry_time')
            ->limit(25)
            ->get();

        $transactionHistory = Transaction::query()
            ->with([
                'vehicle.vehicleType',
                'parkingArea.location',
                'parkingRate.location',
                'parkingRate.vehicleType',
                'rfidCard.vehicle',
            ])
            ->where('user_id', $user->id)
            ->latest('entry_time')
            ->limit(25)
            ->get();

        return (new DashboardResource($user))
            ->parkingLocations($parkingLocations)
            ->activeTransactions($activeTransactions)
            ->transactionHistory($transactionHistory);
    }
}

