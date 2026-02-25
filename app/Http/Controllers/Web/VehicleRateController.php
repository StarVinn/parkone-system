<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\VehicleRateRequest;
use App\Models\ParkingLocation;
use App\Models\ParkingRate;
use App\Models\VehicleType;
use App\Services\VehicleRateService;

class VehicleRateController extends Controller
{
    public function index()
    {
        return inertia('Admin/VehicleRate/Index', [
            'vehicleRates' => ParkingRate::with(['location', 'vehicleType'])->latest()->get(),
        ]);
    }

    public function showCreate()
    {
        return inertia('Admin/VehicleRate/Create', [
            'parkingLocations' => ParkingLocation::latest()->get(),
            'vehicleTypes' => VehicleType::latest()->get(),
        ]);
    }

    public function showEdit($id)
    {
        return inertia('Admin/VehicleRate/Edit', [
            'vehicleRate' => ParkingRate::with(['location', 'vehicleType'])->findOrFail($id),
            'parkingLocations' => ParkingLocation::latest()->get(),
            'vehicleTypes' => VehicleType::latest()->get(),
        ]);
    }

    public function store(VehicleRateRequest $request, VehicleRateService $vehicleRateService)
    {
        $vehicleRateService->createVehicleRate($request->validated());

        return redirect()
            ->route('admin.vehicle-rates.index')
            ->with('success', 'Tarif kendaraan berhasil ditambahkan.');
    }

    public function update(VehicleRateRequest $request, VehicleRateService $vehicleRateService, $id)
    {
        $vehicleRate = ParkingRate::findOrFail($id);
        $vehicleRateService->updateVehicleRate($vehicleRate, $request->validated());

        return redirect()
            ->route('admin.vehicle-rates.index')
            ->with('success', 'Tarif kendaraan berhasil diperbarui.');
    }

    public function destroy($id, VehicleRateService $vehicleRateService)
    {
        $vehicleRate = ParkingRate::findOrFail($id);
        $vehicleRateService->deleteVehicleRate($vehicleRate);

        return redirect('/admin/vehicle-rates')
            ->with('success', 'Tarif kendaraan berhasil dihapus.');
    }
}
