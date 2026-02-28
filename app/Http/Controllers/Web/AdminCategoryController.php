<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ParkingArea;
use App\Models\ParkingLocation;
use App\Models\ParkingRate;
use App\Models\Vehicle;
use App\Models\VehicleType;

class AdminCategoryController extends Controller
{
    public function vehicle()
    {
        return inertia('Admin/Category/Vehicle', [
            'stats' => [
                'vehicleTotal' => Vehicle::count(),
                'vehicleTypeTotal' => VehicleType::count(),
            ],
        ]);
    }

    public function parking()
    {
        return inertia('Admin/Category/Parking', [
            'stats' => [
                'locationTotal' => ParkingLocation::count(),
                'areaTotal' => ParkingArea::count(),
                'rateTotal' => ParkingRate::count(),
            ],
        ]);
    }
}
