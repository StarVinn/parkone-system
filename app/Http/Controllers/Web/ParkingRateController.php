<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\ParkingRateRequest;
use App\Models\ParkingLocation;
use App\Models\ParkingRate;
use App\Models\VehicleType;
use App\Services\ParkingRateService;

class ParkingRateController extends Controller
{
    public function index()
    {
        return inertia('Admin/ParkingRate/Index', [
            'parkingRates' => ParkingRate::with(['location', 'vehicleType'])->latest()->get(),
        ]);
    }

    public function showCreate()
    {
        return inertia('Admin/ParkingRate/Create', [
            'parkingLocations' => ParkingLocation::latest()->get(),
            'vehicleTypes' => VehicleType::latest()->get(),
        ]);
    }

    public function showEdit($id)
    {
        return inertia('Admin/ParkingRate/Edit', [
            'parkingRate' => ParkingRate::with(['location', 'vehicleType'])->findOrFail($id),
            'parkingLocations' => ParkingLocation::latest()->get(),
            'vehicleTypes' => VehicleType::latest()->get(),
        ]);
    }

    public function store(ParkingRateRequest $request, ParkingRateService $parkingRateService)
    {
        $parkingRateService->createParkingRate($request->validated());

        $redirectParams = $request->query('from') === 'overview'
            ? ['from' => 'overview']
            : [];

        return redirect()
            ->route('admin.parking-rates.index', $redirectParams)
            ->with('success', 'Tarif kendaraan berhasil ditambahkan.');
    }

    public function update(ParkingRateRequest $request, ParkingRateService $parkingRateService, $id)
    {
        $parkingRate = ParkingRate::findOrFail($id);
        $parkingRateService->updateParkingRate($parkingRate, $request->validated());

        return redirect()
            ->route('admin.parking-rates.index')
            ->with('success', 'Tarif kendaraan berhasil diperbarui.');
    }

    public function destroy($id, ParkingRateService $parkingRateService)
    {
        $parkingRate = ParkingRate::findOrFail($id);
        $parkingRateService->deleteParkingRate($parkingRate);

        return redirect('/admin/parking-rates')
            ->with('success', 'Tarif kendaraan berhasil dihapus.');
    }
}
