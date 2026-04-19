<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\RfidCard;
use App\Models\Transaction;
use App\Models\Vehicle;
use App\Models\VehicleType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UserDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $user->loadMissing([
            'vehicles.vehicleType:id,name',
            'primaryRfidCard:id,user_id,uid',
        ]);

        if (!$user->primaryRfidCard) {
            return redirect()->route('user.rfid.setup');
        }

        $transactionsQuery = Transaction::query()
            ->where(function ($query) use ($user) {
                $query->whereHas('vehicle', function ($vehicleQuery) use ($user) {
                    $vehicleQuery->where('user_id', $user->id);
                })->orWhereHas('rfidCard', function ($rfidQuery) use ($user) {
                    $rfidQuery->where('user_id', $user->id);
                });
            });

        $totalTransactions = (clone $transactionsQuery)->count();
        $activeTransactions = (clone $transactionsQuery)
            ->where('status', 'active')
            ->count();
        $completedTransactions = (clone $transactionsQuery)
            ->where('status', 'completed')
            ->count();
        $totalSpent = (float) (clone $transactionsQuery)
            ->where('status', 'completed')
            ->sum('total_fee');

        $latestActiveTransaction = (clone $transactionsQuery)
            ->with([
                'parkingArea:id,name,parking_location_id',
                'parkingArea.location:id,name',
                'vehicle:id,license_plate,vehicle_type_id',
                'vehicle.vehicleType:id,name',
            ])
            ->where('status', 'active')
            ->latest('entry_time')
            ->first();

        $recentTransactions = (clone $transactionsQuery)
            ->with([
                'parkingArea:id,name,parking_location_id',
                'parkingArea.location:id,name',
                'vehicle:id,license_plate,vehicle_type_id',
                'vehicle.vehicleType:id,name',
            ])
            ->latest('entry_time')
            ->limit(10)
            ->get()
            ->map(fn (Transaction $transaction) => [
                'id' => (int) $transaction->id,
                'entry_time' => $transaction->entry_time?->toIso8601String(),
                'exit_time' => $transaction->exit_time?->toIso8601String(),
                'status' => (string) ($transaction->status ?? '-'),
                'total_fee' => (float) ($transaction->total_fee ?? 0),
                'location' => (string) ($transaction->parkingArea?->location?->name ?? '-'),
                'area' => (string) ($transaction->parkingArea?->name ?? '-'),
                'plate' => (string) ($transaction->vehicle?->license_plate ?? '-'),
                'vehicle' => (string) ($transaction->vehicle?->vehicleType?->name ?? '-'),
            ])
            ->values()
            ->all();

        return inertia('User/Dashboard', [
            'summary' => [
                'total_transactions' => $totalTransactions,
                'active_transactions' => $activeTransactions,
                'completed_transactions' => $completedTransactions,
                'total_spent' => $totalSpent,
            ],
            'profile' => [
                'name' => (string) $user->name,
                'email' => (string) $user->email,
                'role' => (string) $user->role,
                'rfid_uid' => (string) ($user->primaryRfidCard?->uid ?? '-'),
                'vehicles_count' => (int) $user->vehicles->count(),
            ],
            'activeParking' => $latestActiveTransaction ? [
                'entry_time' => $latestActiveTransaction->entry_time?->toIso8601String(),
                'location' => (string) ($latestActiveTransaction->parkingArea?->location?->name ?? '-'),
                'area' => (string) ($latestActiveTransaction->parkingArea?->name ?? '-'),
                'plate' => (string) ($latestActiveTransaction->vehicle?->license_plate ?? '-'),
                'vehicle' => (string) ($latestActiveTransaction->vehicle?->vehicleType?->name ?? '-'),
            ] : null,
            'recentTransactions' => $recentTransactions,
        ]);
    }

    public function showRfidSetup(Request $request)
    {
        $user = $request->user();
        $user->loadMissing([
            'primaryRfidCard:id,user_id,uid',
            'vehicles:id,user_id,license_plate,vehicle_type_id',
        ]);

        if ($user->primaryRfidCard) {
            return redirect()->route('user.dashboard');
        }

        $latestVehicle = $user->vehicles->sortByDesc('id')->first();
        $vehicleTypes = VehicleType::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(fn (VehicleType $type) => [
                'id' => (int) $type->id,
                'name' => (string) $type->name,
            ])
            ->values()
            ->all();

        return inertia('User/RfidSetup', [
            'profile' => [
                'name' => (string) $user->name,
                'email' => (string) $user->email,
                'role' => (string) $user->role,
            ],
            'initialVehicle' => $latestVehicle ? [
                'license_plate' => (string) $latestVehicle->license_plate,
                'vehicle_type_id' => (int) $latestVehicle->vehicle_type_id,
            ] : null,
            'vehicleTypes' => $vehicleTypes,
        ]);
    }

    public function storeRfidSetup(Request $request)
    {
        $validated = $request->validate([
            'rfid_uid' => ['required', 'string', 'max:255'],
            'license_plate' => ['required', 'string', 'max:20', 'regex:/^[A-Z]{1,2}\s?[0-9]{1,4}\s?[A-Z]{0,3}$/i'],
            'vehicle_type_id' => ['required', 'integer', 'exists:vehicle_types,id'],
        ], [
            'rfid_uid.required' => 'RFID wajib diisi.',
            'rfid_uid.string' => 'RFID harus berupa teks.',
            'rfid_uid.max' => 'RFID maksimal 255 karakter.',
            'license_plate.required' => 'Plat nomor wajib diisi.',
            'license_plate.string' => 'Plat nomor harus berupa teks.',
            'license_plate.max' => 'Plat nomor maksimal 20 karakter.',
            'license_plate.regex' => 'Format plat tidak valid. Contoh yang benar: AD 45 ID.',
            'vehicle_type_id.required' => 'Tipe kendaraan wajib dipilih.',
            'vehicle_type_id.integer' => 'Tipe kendaraan tidak valid.',
            'vehicle_type_id.exists' => 'Tipe kendaraan tidak ditemukan.',
        ]);

        $uid = strtoupper(trim((string) $validated['rfid_uid']));
        $licensePlate = $this->normalizeLicensePlate((string) $validated['license_plate']);
        $licensePlateCanonical = $this->canonicalizeLicensePlate($licensePlate);
        $vehicleTypeId = (int) $validated['vehicle_type_id'];

        if ($uid === '') {
            throw ValidationException::withMessages([
                'rfid_uid' => 'RFID wajib diisi.',
            ]);
        }

        if ($licensePlate === '') {
            throw ValidationException::withMessages([
                'license_plate' => 'Plat nomor wajib diisi.',
            ]);
        }

        $user = $request->user();

        DB::transaction(function () use ($user, $uid, $licensePlate, $licensePlateCanonical, $vehicleTypeId) {
            $existingCard = RfidCard::query()
                ->whereRaw('UPPER(uid) = ?', [$uid])
                ->lockForUpdate()
                ->first();

            if ($existingCard && (int) $existingCard->user_id > 0 && (int) $existingCard->user_id !== (int) $user->id) {
                throw ValidationException::withMessages([
                    'rfid_uid' => 'RFID ini sudah terhubung ke akun lain.',
                ]);
            }

            $existingVehicle = Vehicle::query()
                ->withTrashed()
                ->whereRaw('REPLACE(UPPER(license_plate), " ", "") = ?', [$licensePlateCanonical])
                ->lockForUpdate()
                ->first();

            if ($existingVehicle && (int) $existingVehicle->user_id > 0 && (int) $existingVehicle->user_id !== (int) $user->id) {
                throw ValidationException::withMessages([
                    'license_plate' => 'Plat nomor ini sudah terhubung ke akun lain.',
                ]);
            }

            if ($existingVehicle) {
                if ($existingVehicle->trashed()) {
                    $existingVehicle->restore();
                }

                $existingVehicle->forceFill([
                    'user_id' => $user->id,
                    'license_plate' => $licensePlate,
                    'vehicle_type_id' => $vehicleTypeId,
                ])->save();

                $vehicle = $existingVehicle;
            } else {
                $vehicle = Vehicle::create([
                    'user_id' => $user->id,
                    'license_plate' => $licensePlate,
                    'vehicle_type_id' => $vehicleTypeId,
                ]);
            }

            RfidCard::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            if ($existingCard) {
                $existingCard->forceFill([
                    'user_id' => $user->id,
                    'vehicle_id' => $vehicle->id,
                    'is_active' => true,
                ])->save();
            } else {
                $existingCardByVehicle = RfidCard::query()
                    ->where('vehicle_id', $vehicle->id)
                    ->lockForUpdate()
                    ->first();

                if ($existingCardByVehicle) {
                    $existingCardByVehicle->forceFill([
                        'user_id' => $user->id,
                        'uid' => $uid,
                        'is_active' => true,
                    ])->save();
                } else {
                    RfidCard::create([
                        'user_id' => $user->id,
                        'vehicle_id' => $vehicle->id,
                        'uid' => $uid,
                        'is_active' => true,
                    ]);
                }
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'activity' => 'Bind RFID on user onboarding: ' . $uid . ' (' . $licensePlate . ')',
                'activity_time' => now(),
            ]);
        });

        return redirect()->route('user.dashboard')
            ->with('success', 'RFID berhasil dihubungkan ke akun Anda.');
    }

    private function normalizeLicensePlate(string $value): string
    {
        $compact = $this->canonicalizeLicensePlate($value);

        if ($compact === '') {
            return '';
        }

        if (preg_match('/^([A-Z]{1,2})([0-9]{1,4})([A-Z]{0,3})$/', $compact, $matches)) {
            return trim($matches[1] . ' ' . $matches[2] . ' ' . $matches[3]);
        }

        return $compact;
    }

    private function canonicalizeLicensePlate(string $value): string
    {
        return strtoupper(preg_replace('/[^A-Z0-9]/i', '', $value) ?? '');
    }
}
