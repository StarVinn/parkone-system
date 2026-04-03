<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\ParkingRateRequest;
use App\Models\ParkingLocation;
use App\Models\ParkingRate;
use App\Models\VehicleType;
use App\Services\ParkingRateService;
use Inertia\Response;

class ParkingRateController extends Controller
{
    public function index(): Response
    {
        return inertia('Admin/ParkingRate/Index', [
            'parkingRates' => ParkingRate::with(['location', 'vehicleType'])->latest()->paginate(15)->withQueryString(),
            'parkingLocations' => ParkingLocation::latest()->get(),
            'vehicleTypes' => VehicleType::latest()->get(),
        ]);
    }

    public function store(ParkingRateRequest $request, ParkingRateService $parkingRateService)
    {
        $parkingRateService->createParkingRate($request->validated());

        return redirect()
            ->route('admin.parking-rates.index')
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
