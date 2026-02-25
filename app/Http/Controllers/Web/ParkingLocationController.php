<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\ParkingLocationRequest;
use App\Models\ParkingLocation;
use App\Services\ParkingLocationService;
use Illuminate\Support\Facades\Auth;

class ParkingLocationController extends Controller
{
    public function index(){
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        return inertia('Admin/ParkingLocation/Index', [
            'parkingLocations' => ParkingLocation::latest()->get(),
        ]);
    }
    public function showCreate(){
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        return inertia('Admin/ParkingLocation/Create');
    }
    public function showEdit($id){
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        return inertia('Admin/ParkingLocation/Edit', [
            'parkingLocation' => ParkingLocation::findOrFail($id),
        ]);
    }
    public function store(ParkingLocationRequest $request, ParkingLocationService $parkingLocationService){
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        
        $parkingLocationService->createParkingLocation($request->validated());

        return redirect()
            ->route('admin.parking-locations.index')
            ->with('success', 'Lokasi parkir berhasil ditambahkan.');
    }
    public function update(ParkingLocationRequest $request, ParkingLocationService $parkingLocationService, $id){
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        $parkingLocation = ParkingLocation::findOrFail($id);
        $parkingLocationService->updateParkingLocation($parkingLocation, $request->validated());

        return redirect()
            ->route('admin.parking-locations.index')
            ->with('success', 'Lokasi parkir berhasil diperbarui.');
    }
    public function destroy($id, ParkingLocationService $parkingLocationService){
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        $parkingLocation = ParkingLocation::findOrFail($id);
        $parkingLocationService->deleteParkingLocation($parkingLocation);
        return redirect('/admin/parking-locations')
            ->with('success', 'Lokasi parkir berhasil dihapus.');
    }
}
