<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\VehicleRequest;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleType;
use App\Services\VehicleService;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        $filters = [
            'search' => $request->string('search')->toString(),
            'user_id' => $request->string('user_id')->toString(),
            'vehicle_type_id' => $request->string('vehicle_type_id')->toString(),
        ];

        $vehicles = Vehicle::with(['user', 'vehicleType'])
            ->when($filters['search'], function ($query, $search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('license_plate', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->orWhereHas('vehicleType', function ($typeQuery) use ($search) {
                            $typeQuery->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($filters['user_id'], fn($query, $userId) => $query->where('user_id', $userId))
            ->when($filters['vehicle_type_id'], fn($query, $typeId) => $query->where('vehicle_type_id', $typeId))
            ->latest()
            ->get();

        return inertia('Admin/Vehicle/Index', [
            'vehicles' => $vehicles,
            'filters' => $filters,
            'users' => User::select('id', 'name', 'email')
                ->where('is_active', true)
                ->orderBy('name')
                ->get(),
            'vehicleTypes' => VehicleType::latest()->get(),
        ]);
    }

    public function showCreate()
    {
        return inertia('Admin/Vehicle/Create', [
            'users' => User::select('id', 'name', 'email')
                ->where('is_active', true)
                ->orderBy('name')
                ->get(),
            'vehicleTypes' => VehicleType::latest()->get(),
        ]);
    }

    public function showEdit($id)
    {
        return inertia('Admin/Vehicle/Edit', [
            'vehicle' => Vehicle::with(['user', 'vehicleType'])->findOrFail($id),
            'users' => User::select('id', 'name', 'email')
                ->where('is_active', true)
                ->orderBy('name')
                ->get(),
            'vehicleTypes' => VehicleType::latest()->get(),
        ]);
    }

    public function store(VehicleRequest $request, VehicleService $vehicleService)
    {
        $validated = $request->validated();
        $createdCount = $vehicleService->createManyVehicles($validated['vehicles']);

        return redirect()
            ->route('admin.vehicles.index')
            ->with('success', $createdCount . ' kendaraan berhasil ditambahkan.');
    }

    public function update(VehicleRequest $request, VehicleService $vehicleService, $id)
    {
        $vehicle = Vehicle::findOrFail($id);
        $vehicleService->updateVehicle($vehicle, $request->validated());

        return redirect()
            ->route('admin.vehicles.index')
            ->with('success', 'Kendaraan berhasil diperbarui.');
    }

    public function destroy($id, VehicleService $vehicleService)
    {
        $vehicle = Vehicle::findOrFail($id);
        $vehicleService->deleteVehicle($vehicle);

        return redirect('/admin/vehicles')
            ->with('success', 'Kendaraan berhasil dihapus.');
    }
}
