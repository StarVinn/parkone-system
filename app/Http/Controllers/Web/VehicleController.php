<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\VehicleRequest;
use App\Models\RfidCard;
use App\Models\Vehicle;
use App\Models\VehicleType;
use App\Services\VehicleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Response;

class VehicleController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = [
            'search' => $request->string('search')->toString(),
            'vehicle_type_id' => $request->string('vehicle_type_id')->toString(),
        ];

        $vehicles = Vehicle::with(['vehicleType', 'rfidCard'])
            ->when($filters['search'], function ($query, $search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('license_plate', 'like', "%{$search}%")
                        ->orWhereHas('vehicleType', function ($typeQuery) use ($search) {
                            $typeQuery->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($filters['vehicle_type_id'], fn($query, $typeId) => $query->where('vehicle_type_id', $typeId))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return inertia('Admin/Vehicle/Index', [
            'vehicles' => $vehicles,
            'filters' => $filters,
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

    public function assignRfid(Request $request, $id)
    {
        $request->validate([
            'rfid_card_id' => 'required|exists:rfid_cards,id',
        ]);

        $vehicle = Vehicle::findOrFail($id);
        $rfidCard = RfidCard::findOrFail($request->rfid_card_id);

        // Check if RFID is already assigned to another vehicle
        if ($rfidCard->vehicle_id && $rfidCard->vehicle_id !== $vehicle->id) {
            return redirect()
                ->route('admin.vehicles.index')
                ->with('error', 'RFID sudah terpasang ke kendaraan lain.');
        }

        DB::transaction(function () use ($vehicle, $rfidCard) {
            RfidCard::where('vehicle_id', $vehicle->id)
                ->where('id', '!=', $rfidCard->id)
                ->update(['vehicle_id' => null]);

            $rfidCard->update([
                'vehicle_id' => $vehicle->id,
                'is_active' => true,
            ]);
        });

        return redirect()
            ->route('admin.vehicles.index')
            ->with('success', 'RFID berhasil ditetapkan ke kendaraan.');
    }

    public function destroy($id, VehicleService $vehicleService)
    {
        $vehicle = Vehicle::findOrFail($id);
        $vehicleService->deleteVehicle($vehicle);

        return redirect('/admin/vehicles')
            ->with('success', 'Kendaraan berhasil dihapus.');
    }

    public function getAvailableRfidCards()
    {
        $rfidCards = RfidCard::with('user')
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('vehicle_id')
                    ->orWhere('vehicle_id', 0);
            })
            ->get()
            ->map(function ($card) {
                return [
                    'id' => $card->id,
                    'uid' => $card->uid,
                    'user' => $card->user ? ['email' => $card->user->email] : null,
                ];
            });

        return response()->json(['rfidCards' => $rfidCards]);
    }
}
