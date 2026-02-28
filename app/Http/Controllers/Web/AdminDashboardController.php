<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ParkingArea;
use App\Models\ParkingLocation;
use App\Models\ParkingRate;
use App\Models\Vehicle;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $webLogins = ActivityLog::query()
            ->where('activity', 'like', 'User login%')
            ->where(function ($query) {
                $query->where('activity', 'User login')
                    ->orWhere('activity', 'like', '%(web)%');
            })
            ->count();

        $mobileLogins = ActivityLog::query()
            ->where('activity', 'like', 'User login%')
            ->where('activity', 'like', '%(mobile)%')
            ->count();

        $vehicleCreatedThisMonth = Vehicle::query()
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count();

        $parkingCreatedThisMonth = ParkingLocation::query()
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count()
            + ParkingArea::query()
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->count()
            + ParkingRate::query()
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->count();

        return inertia('Admin/Dashboard', [
            'loginChart' => [
                'web' => $webLogins,
                'mobile' => $mobileLogins,
                'total' => $webLogins + $mobileLogins,
            ],
            'creationChart' => [
                'vehicle' => $vehicleCreatedThisMonth,
                'parking' => $parkingCreatedThisMonth,
            ],
        ]);
    }
}
