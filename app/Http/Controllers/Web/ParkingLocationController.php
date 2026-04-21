<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\ParkingLocationRequest;
use App\Models\ParkingLocation;
use App\Models\User;
use App\Services\ParkingLocationService;
use Illuminate\Support\Facades\Auth;
use Inertia\Response;

class ParkingLocationController extends Controller
{
    public function index(): Response
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        
        return inertia('Admin/ParkingLocation/Index', [
            'parkingLocations' => ParkingLocation::query()
                ->with('owner:id,name,email')
                ->latest()
                ->paginate(15)
                ->withQueryString(),
            'owners' => User::query()
                ->where('role', 'owner')
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'email']),
        ]);
    }

    public function store(ParkingLocationRequest $request, ParkingLocationService $parkingLocationService)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        
        $parkingLocationService->createParkingLocation($request->validated());

        return redirect()
            ->route('admin.parking-locations.index')
            ->with('success', 'Lokasi parkir berhasil ditambahkan.');
    }

    public function update(ParkingLocationRequest $request, ParkingLocationService $parkingLocationService, $id)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        
        $parkingLocation = ParkingLocation::findOrFail($id);
        $parkingLocationService->updateParkingLocation($parkingLocation, $request->validated());

        return redirect()
            ->route('admin.parking-locations.index')
            ->with('success', 'Lokasi parkir berhasil diperbarui.');
    }

    public function destroy($id, ParkingLocationService $parkingLocationService)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        
        $parkingLocation = ParkingLocation::findOrFail($id);
        $parkingLocationService->deleteParkingLocation($parkingLocation);
        
        return redirect('/admin/parking-locations')
            ->with('success', 'Lokasi parkir berhasil dihapus.');
    }
}
