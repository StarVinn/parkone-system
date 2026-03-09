<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\VehicleTypeRequest;
use App\Models\VehicleType;
use App\Services\VehicleTypeService;
use Illuminate\Support\Facades\Auth;
use Inertia\Response;

class VehicleTypeController extends Controller
{
    public function index(): Response
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        
        return inertia('Admin/VehicleType/Index', [
            'vehicleTypes' => VehicleType::latest()->get(),
        ]);
    }

    public function store(VehicleTypeRequest $request, VehicleTypeService $vehicleTypeService)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        
        $vehicleTypeService->createVehicleType($request->validated());

        return redirect()
            ->route('admin.vehicle-types.index')
            ->with('success', 'Tipe kendaraan berhasil ditambahkan.');
    }

    public function update(VehicleTypeRequest $request, VehicleTypeService $vehicleTypeService, $id)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        
        $vehicleType = \App\Models\VehicleType::findOrFail($id);
        $vehicleTypeService->updateVehicleType($vehicleType, $request->validated());

        return redirect()
            ->route('admin.vehicle-types.index')
            ->with('success', 'Tipe kendaraan berhasil diperbarui.');
    }

    public function destroy($id, VehicleTypeService $vehicleTypeService)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');
        
        $vehicleType = \App\Models\VehicleType::findOrFail($id);
        $vehicleTypeService->deleteVehicleType($vehicleType);

        return redirect('/admin/vehicle-types')
            ->with('success', 'Tipe kendaraan berhasil dihapus.');
    }
}
