<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\RfidCard;
use App\Models\Transaction;
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
        $user->loadMissing(['primaryRfidCard:id,user_id,uid']);

        if ($user->primaryRfidCard) {
            return redirect()->route('user.dashboard');
        }

        return inertia('User/RfidSetup', [
            'profile' => [
                'name' => (string) $user->name,
                'email' => (string) $user->email,
                'role' => (string) $user->role,
            ],
        ]);
    }

    public function storeRfidSetup(Request $request)
    {
        $validated = $request->validate([
            'rfid_uid' => ['required', 'string', 'max:255'],
        ], [
            'rfid_uid.required' => 'RFID wajib diisi.',
            'rfid_uid.string' => 'RFID harus berupa teks.',
            'rfid_uid.max' => 'RFID maksimal 255 karakter.',
        ]);

        $uid = strtoupper(trim((string) $validated['rfid_uid']));
        if ($uid === '') {
            throw ValidationException::withMessages([
                'rfid_uid' => 'RFID wajib diisi.',
            ]);
        }

        $user = $request->user();

        DB::transaction(function () use ($user, $uid) {
            $existingCard = RfidCard::query()
                ->whereRaw('UPPER(uid) = ?', [$uid])
                ->lockForUpdate()
                ->first();

            if ($existingCard && (int) $existingCard->user_id > 0 && (int) $existingCard->user_id !== (int) $user->id) {
                throw ValidationException::withMessages([
                    'rfid_uid' => 'RFID ini sudah terhubung ke akun lain.',
                ]);
            }

            RfidCard::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            if ($existingCard) {
                $existingCard->forceFill([
                    'user_id' => $user->id,
                    'is_active' => true,
                ])->save();
            } else {
                RfidCard::create([
                    'user_id' => $user->id,
                    'uid' => $uid,
                    'is_active' => true,
                ]);
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'activity' => 'Bind RFID on user onboarding: ' . $uid,
                'activity_time' => now(),
            ]);
        });

        return redirect()->route('user.dashboard')
            ->with('success', 'RFID berhasil dihubungkan ke akun Anda.');
    }
}
