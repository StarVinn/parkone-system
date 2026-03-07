<?php

namespace App\Services;

use App\Exceptions\VehicleNotRegisteredException;
use App\Models\ActivityLog;
use App\Models\ParkingArea;
use App\Models\ParkingLocation;
use App\Models\ParkingRate;
use App\Models\Transaction;
use App\Models\Vehicle;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class TransactionService
{
    public function getOfficerDashboardData(?int $locationId = null, ?int $areaId = null): array
    {
        $today = now()->startOfDay();
        $selectedArea = null;

        if ($areaId) {
            $selectedArea = ParkingArea::query()
                ->with('location:id,name')
                ->find($areaId);
        }

        if ($selectedArea && $locationId && (int) $selectedArea->parking_location_id !== (int) $locationId) {
            $selectedArea = null;
        }

        if ($selectedArea && !$locationId) {
            $locationId = (int) $selectedArea->parking_location_id;
        }

        $activeTransactions = Transaction::query()
            ->with([
                'vehicle:id,license_plate,vehicle_type_id',
                'vehicle.vehicleType:id,name',
                'parkingArea:id,name',
            ])
            ->when($selectedArea, fn($query) => $query->where('parking_area_id', $selectedArea->id))
            ->where('status', 'active')
            ->latest('entry_time')
            ->get();

        $recentTransactions = Transaction::query()
            ->with([
                'vehicle:id,license_plate,vehicle_type_id',
                'vehicle.vehicleType:id,name',
                'parkingArea:id,name',
            ])
            ->when($selectedArea, fn($query) => $query->where('parking_area_id', $selectedArea->id))
            ->latest()
            ->take(12)
            ->get();

        $completedTodayQuery = Transaction::query()
            ->where('status', 'completed')
            ->where('exit_time', '>=', $today)
            ->when($selectedArea, fn($query) => $query->where('parking_area_id', $selectedArea->id));

        $entryVehicleTypes = collect();
        if ($selectedArea) {
            $entryVehicleTypes = ParkingRate::query()
                ->with('vehicleType:id,name')
                ->where('location_id', $selectedArea->parking_location_id)
                ->get(['id', 'vehicle_type_id', 'location_id'])
                ->pluck('vehicleType')
                ->filter()
                ->unique('id')
                ->sortBy('name')
                ->values()
                ->map(fn($type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                ]);
        }

        return [
            'parkingLocations' => ParkingLocation::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'parkingAreas' => ParkingArea::query()
                ->select('id', 'name', 'capacity', 'occupied')
                ->when($locationId, fn($query) => $query->where('parking_location_id', $locationId))
                ->orderBy('name')
                ->get(),
            'selectedParkingArea' => $selectedArea ? [
                'id' => $selectedArea->id,
                'name' => $selectedArea->name,
                'capacity' => $selectedArea->capacity,
                'occupied' => $selectedArea->occupied,
                'location_name' => $selectedArea->location?->name,
            ] : null,
            'scope' => [
                'location_id' => $locationId ? (string) $locationId : '',
                'parking_area_id' => $selectedArea ? (string) $selectedArea->id : '',
                'is_selected' => (bool) $selectedArea,
            ],
            'activeTransactions' => $activeTransactions,
            'recentTransactions' => $recentTransactions,
            'stats' => [
                'active' => $activeTransactions->count(),
                'completed_today' => (clone $completedTodayQuery)->count(),
                'revenue_today' => (float) (clone $completedTodayQuery)->sum('total_fee'),
            ],
            'entryVehicleTypes' => $entryVehicleTypes,
        ];
    }

    public function processEntry(array $data, int $officerId): Transaction
    {
        return DB::transaction(function () use ($data, $officerId) {
            $plate = $this->formatPlate($data['license_plate']);
            $vehicle = $this->findVehicleByPlate($plate);

            $existingActiveTransaction = Transaction::query()
                ->where('vehicle_id', $vehicle->id)
                ->where('status', 'active')
                ->first();

            if ($existingActiveTransaction) {
                throw ValidationException::withMessages([
                    'license_plate' => 'Kendaraan ini masih tercatat berada di area parkir.',
                ]);
            }

            $parkingArea = ParkingArea::query()
                ->lockForUpdate()
                ->find((int) $data['parking_area_id']);

            if (!$parkingArea) {
                throw ValidationException::withMessages([
                    'parking_area_id' => 'Area parkir tidak ditemukan.',
                ]);
            }

            if ($parkingArea->occupied >= $parkingArea->capacity) {
                throw ValidationException::withMessages([
                    'parking_area_id' => 'Area parkir sudah penuh.',
                ]);
            }

            $parkingRate = ParkingRate::query()
                ->where('location_id', $parkingArea->parking_location_id)
                ->where('vehicle_type_id', $vehicle->vehicle_type_id)
                ->first();

            if (!$parkingRate) {
                $vehicleTypeName = $vehicle->vehicleType?->name ?? 'tipe kendaraan ini';
                $locationName = $parkingArea->location?->name ?? 'lokasi area ini';

                throw ValidationException::withMessages([
                    'parking_area_id' => 'Tarif untuk ' . $vehicleTypeName . ' belum tersedia di ' . $locationName . '.',
                ]);
            }

            $photoPath = null;
            if (($data['vehicle_photo'] ?? null) instanceof UploadedFile) {
                $photoPath = Storage::disk('public')->putFile('vehicle-entry-photos', $data['vehicle_photo']);
            }

            $transaction = Transaction::create([
                'user_id' => $officerId,
                'vehicle_id' => $vehicle->id,
                'parking_area_id' => $parkingArea->id,
                'parking_rate_id' => $parkingRate->id,
                'entry_time' => now(),
                'entry_vehicle_photo_path' => $photoPath,
                'status' => 'active',
            ]);

            $parkingArea->increment('occupied');

            ActivityLog::create([
                'user_id' => $officerId,
                'activity' => 'Check-in kendaraan: ' . $plate,
                'activity_time' => now(),
            ]);

            return $transaction;
        });
    }

    public function processExit(array $data, int $officerId): Transaction
    {
        return DB::transaction(function () use ($data, $officerId) {
            $plate = $this->formatPlate($data['license_plate']);
            $vehicle = $this->findVehicleByPlate($plate);

            $transaction = Transaction::query()
                ->with(['parkingArea', 'parkingRate'])
                ->where('vehicle_id', $vehicle->id)
                ->where('status', 'active')
                ->latest('entry_time')
                ->first();

            if (!$transaction) {
                throw ValidationException::withMessages([
                    'license_plate' => 'Tidak ada transaksi aktif untuk plat nomor ini.',
                ]);
            }

            $exitTime = now();
            $hours = $this->calculateHours($transaction->entry_time, $exitTime);
            $totalFee = $this->calculateFee($transaction->parkingRate, $hours);

            $transaction->update([
                'exit_time' => $exitTime,
                'total_hours' => $hours,
                'total_fee' => $totalFee,
                'status' => 'completed',
            ]);

            if ($transaction->parkingArea) {
                $parkingArea = ParkingArea::query()
                    ->lockForUpdate()
                    ->find($transaction->parkingArea->id);

                if ($parkingArea && $parkingArea->occupied > 0) {
                    $parkingArea->decrement('occupied');
                }
            }

            ActivityLog::create([
                'user_id' => $officerId,
                'activity' => 'Check-out kendaraan: ' . $plate . ', biaya: Rp ' . number_format($totalFee, 0, ',', '.'),
                'activity_time' => now(),
            ]);

            return $transaction->fresh(['vehicle', 'parkingArea', 'parkingRate']);
        });
    }

    public function formatPlate(string $plate): string
    {
        $cleaned = preg_replace('/[^A-Z0-9]/', '', strtoupper($plate));

        if (!$cleaned) {
            return '';
        }

        if (preg_match('/^([A-Z]{1,2})([0-9]{1,4})([A-Z]{1,3})$/', $cleaned, $matches)) {
            $prefix = $matches[1] ?? '';
            $number = $matches[2] ?? '';
            $suffix = $matches[3] ?? '';

            return trim($prefix . ' ' . $number . ' ' . $suffix);
        }

        throw ValidationException::withMessages([
            'license_plate' => 'Format plat harus seperti "D 4512 I" atau "AD 45 ID".',
        ]);
    }

    private function canonicalPlate(string $plate): string
    {
        return preg_replace('/[^A-Z0-9]/', '', strtoupper($plate)) ?? '';
    }

    private function findVehicleByPlate(string $plate): Vehicle
    {
        $canonical = $this->canonicalPlate($plate);

        $vehicle = Vehicle::query()
            ->whereRaw("REPLACE(UPPER(license_plate), ' ', '') = ?", [$canonical])
            ->first();

        if (!$vehicle) {
            throw new VehicleNotRegisteredException($plate);
        }

        return $vehicle;
    }

    private function calculateHours(Carbon|string $entryTime, Carbon $exitTime): float
    {
        $entry = $entryTime instanceof Carbon ? $entryTime : Carbon::parse($entryTime);
        $seconds = max(1, $entry->diffInSeconds($exitTime));

        return (float) max(1, ceil($seconds / 3600));
    }

    private function calculateFee(ParkingRate $rate, float $hours): float
    {
        if ($rate->rate_type === 'flat') {
            return (float) ($rate->flat_rate ?? 0);
        }

        return (float) (($rate->rate_per_hour ?? 0) * $hours);
    }
}
