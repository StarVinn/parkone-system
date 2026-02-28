<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\ParkingAreaRequest;
use App\Models\ParkingArea;
use App\Models\ParkingLocation;
use App\Services\ParkingAreaService;
use Illuminate\Support\Facades\Auth;

class ParkingAreaController extends Controller
{
    public function index()
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        return inertia('Admin/ParkingArea/Index', [
            'parkingAreas' => ParkingArea::with('location')->latest()->get(),
        ]);
    }

    public function showCreate()
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        return inertia('Admin/ParkingArea/Create', [
            'parkingLocations' => ParkingLocation::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function showEdit($id){
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        return inertia('Admin/ParkingArea/Edit', [
            'parkingArea' => ParkingArea::findOrFail($id),
            'parkingLocations' => ParkingLocation::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(ParkingAreaRequest $request, ParkingAreaService $parkingAreaService){
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        
        $parkingAreaService->createParkingArea($request->validated());

        $redirectParams = $request->query('from') === 'overview'
            ? ['from' => 'overview']
            : [];

        return redirect()
            ->route('admin.parking-areas.index', $redirectParams)
            ->with('success', 'Area parkir berhasil ditambahkan.');
    }

    public function update(ParkingAreaRequest $request, ParkingAreaService $parkingAreaService, $id){
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        $parkingArea = \App\Models\ParkingArea::findOrFail($id);
        $parkingAreaService->updateParkingArea($parkingArea, $request->validated());

        return redirect()
            ->route('admin.parking-areas.index')
            ->with('success', 'Area parkir berhasil diperbarui.');
    }

    public function destroy($id, ParkingAreaService $parkingAreaService){
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        
        $parkingArea = \App\Models\ParkingArea::findOrFail($id);
        $parkingAreaService->deleteParkingArea($parkingArea);

        return redirect('/admin/parking-areas')
            ->with('success', 'Area parkir berhasil dihapus.');
    }
}
