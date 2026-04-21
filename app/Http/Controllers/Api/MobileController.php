<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ParkingLocation;
use App\Models\RfidCard;
use App\Models\Transaction;
use App\Models\User;
use App\Models\VehicleType;
use App\Services\VehicleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MobileController extends Controller
{
    private function formatUser(User $user): array
    {
        $user->loadMissing(['rfidCards', 'primaryRfidCard']);

        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'profile_photo' => $user->profile_photo,
            'profile_photo_url' => $user->profile_photo_url,
            'rfid_uid' => $user->rfid_uid,
            'is_active' => (bool) $user->is_active,
            'status' => $user->status,
            'requires_rfid_setup' => ! (bool) $user->rfid_uid,
        ];
    }

    private function toFloat(mixed $value): ?float
    {
        return is_numeric($value) ? (float) $value : null;
    }

    private function buildMapsUrl(mixed $latitude, mixed $longitude): ?string
    {
        $lat = $this->toFloat($latitude);
        $lng = $this->toFloat($longitude);

        if ($lat === null || $lng === null) {
            return null;
        }

        return 'https://www.google.com/maps?q=' . urlencode($lat . ',' . $lng);
    }

    private function buildStreetViewUrl(mixed $latitude, mixed $longitude): ?string
    {
        $lat = $this->toFloat($latitude);
        $lng = $this->toFloat($longitude);
        $apiKey = config('services.google.maps_api_key');
        $streetViewEnabled = (bool) config('services.google.street_view_enabled', false);

        if (! $streetViewEnabled || $lat === null || $lng === null || ! $apiKey) {
            return null;
        }

        return 'https://maps.googleapis.com/maps/api/streetview?size=1200x800&fov=80&pitch=0&source=outdoor&location=' . rawurlencode($lat . ',' . $lng) . '&key=' . rawurlencode($apiKey);
    }

    private function mapRate($rate): array
    {
        return [
            'id' => (string) $rate->id,
            'vehicle_type_id' => (string) $rate->vehicle_type_id,
            'vehicle_type' => $rate->relationLoaded('vehicleType') && $rate->vehicleType ? [
                'id' => (string) $rate->vehicleType->id,
                'name' => $rate->vehicleType->name,
            ] : null,
            'pricing_rule_key' => $rate->pricing_rule_key,
            'version_number' => (int) $rate->version_number,
            'is_current' => (bool) $rate->is_current,
            'rate_type' => $rate->rate_type,
            'rate_per_hour' => $rate->first_hour_rate ?? $rate->rate_per_hour,
            'first_hour_rate' => $rate->first_hour_rate ?? $rate->rate_per_hour,
            'next_hour_rate' => $rate->next_hour_rate ?? $rate->rate_per_hour,
            'grace_minutes' => (int) ($rate->grace_minutes ?? 0),
            'flat_rate' => $rate->flat_rate,
        ];
    }

    private function formatPlate(string $plate): string
    {
        $cleaned = preg_replace('/[^A-Z0-9]/', '', strtoupper($plate));

        if (! $cleaned) {
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

    private function mapLocation(ParkingLocation $location): array
    {
        $areas = collect($location->areas ?? []);
        $rates = collect($location->rates ?? []);
        $capacity = (int) $areas->sum('capacity');
        $occupied = (int) $areas->sum('occupied');
        $available = max($capacity - $occupied, 0);

        return [
            'id' => (string) $location->id,
            'name' => $location->name,
            'description' => $location->description,
            'latitude' => $location->latitude,
            'longitude' => $location->longitude,
            'capacity' => $capacity,
            'occupied' => $occupied,
            'available_slots' => $available,
            'occupancy_rate' => $capacity > 0 ? round(($occupied / $capacity) * 100, 1) : 0,
            'maps_url' => $this->buildMapsUrl($location->latitude, $location->longitude),
            'street_view_url' => $this->buildStreetViewUrl($location->latitude, $location->longitude),
            'cover_image_url' => $this->buildStreetViewUrl($location->latitude, $location->longitude),
            'areas' => $areas->map(function ($area) {
                return [
                    'id' => (string) $area->id,
                    'name' => $area->name,
                    'capacity' => (int) $area->capacity,
                    'occupied' => (int) $area->occupied,
                    'available_slots' => max((int) $area->capacity - (int) $area->occupied, 0),
                    'ticket_penalty' => (int) $area->ticket_penalty,
                ];
            })->values()->all(),
            'rates' => $rates->map(fn ($rate) => $this->mapRate($rate))->values()->all(),
        ];
    }

    private function transactionsForUser(User $user)
    {
        return Transaction::query()
            ->with([
                'vehicle.vehicleType',
                'parkingArea.location',
                'parkingRate.location',
                'parkingRate.vehicleType',
                'rfidCard.vehicle',
            ])
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhereHas('rfidCard', function ($rfidQuery) use ($user) {
                        $rfidQuery->where('user_id', $user->id);
                    })
                    ->orWhereHas('vehicle', function ($vehicleQuery) use ($user) {
                        $vehicleQuery->where('user_id', $user->id);
                    });
            });
    }

    private function mapTransaction(Transaction $transaction): array
    {
        $parkingLocation = $transaction->parkingArea?->location;

        return [
            'id' => (string) $transaction->id,
            'status' => $transaction->status,
            'entry_time' => optional($transaction->entry_time)->toIso8601String(),
            'exit_time' => optional($transaction->exit_time)->toIso8601String(),
            'total_hours' => $transaction->total_hours,
            'total_fee' => $transaction->total_fee,
            'parking_session_id' => $transaction->parking_session_id,
            'entry_vehicle_photo_url' => $transaction->entry_vehicle_photo_url,
            'parking_area' => $transaction->parkingArea ? [
                'id' => (string) $transaction->parkingArea->id,
                'name' => $transaction->parkingArea->name,
                'capacity' => (int) $transaction->parkingArea->capacity,
                'occupied' => (int) $transaction->parkingArea->occupied,
            ] : null,
            'location' => $parkingLocation ? [
                'id' => (string) $parkingLocation->id,
                'name' => $parkingLocation->name,
                'latitude' => $parkingLocation->latitude,
                'longitude' => $parkingLocation->longitude,
                'maps_url' => $this->buildMapsUrl($parkingLocation->latitude, $parkingLocation->longitude),
                'street_view_url' => $this->buildStreetViewUrl($parkingLocation->latitude, $parkingLocation->longitude),
            ] : null,
            'vehicle' => $transaction->vehicle ? [
                'id' => (string) $transaction->vehicle->id,
                'license_plate' => $transaction->vehicle->license_plate,
                'vehicle_type' => $transaction->vehicle->vehicleType ? [
                    'id' => (string) $transaction->vehicle->vehicleType->id,
                    'name' => $transaction->vehicle->vehicleType->name,
                ] : null,
            ] : null,
        ];
    }

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->loadMissing(['rfidCards', 'primaryRfidCard']);

        $locations = ParkingLocation::query()
            ->with([
                'areas',
                'rates' => fn ($query) => $query->where('is_current', true)->with('vehicleType'),
            ])
            ->orderBy('name')
            ->get();

        $transactionsQuery = $this->transactionsForUser($user);

        $activeTransaction = (clone $transactionsQuery)
            ->where('status', 'active')
            ->latest('entry_time')
            ->first();

        $recentTransactions = (clone $transactionsQuery)
            ->latest('entry_time')
            ->limit(10)
            ->get();

        return response()->json([
            'message' => 'Dashboard mobile berhasil dimuat.',
            'data' => [
                'user' => $this->formatUser($user),
                'requires_rfid_setup' => ! (bool) $user->rfid_uid,
                'active_transaction' => $activeTransaction ? $this->mapTransaction($activeTransaction) : null,
                'parking_locations' => $locations->map(fn (ParkingLocation $location) => $this->mapLocation($location))->values()->all(),
                'recent_transactions' => $recentTransactions->map(fn (Transaction $transaction) => $this->mapTransaction($transaction))->values()->all(),
            ],
        ]);
    }

    public function locations(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $onlyAvailable = filter_var($request->boolean('only_available', false), FILTER_VALIDATE_BOOL);

        $locations = ParkingLocation::query()
            ->with([
                'areas',
                'rates' => fn ($query) => $query->where('is_current', true)->with('vehicleType'),
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('name', 'like', '%' . $search . '%')
                        ->orWhere('description', 'like', '%' . $search . '%');
                });
            })
            ->orderBy('name')
            ->get()
            ->map(fn (ParkingLocation $location) => $this->mapLocation($location));

        if ($onlyAvailable) {
            $locations = $locations->filter(fn (array $location) => (int) $location['available_slots'] > 0)->values();
        }

        return response()->json([
            'message' => 'Daftar lokasi parkir berhasil dimuat.',
            'data' => $locations->values()->all(),
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $user = $request->user();
        $status = trim((string) $request->query('status', ''));

        $transactions = $this->transactionsForUser($user)
            ->when(in_array($status, ['active', 'completed', 'cancelled'], true), function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->latest('entry_time')
            ->limit(100)
            ->get();

        return response()->json([
            'message' => 'Riwayat transaksi berhasil dimuat.',
            'data' => $transactions->map(fn (Transaction $transaction) => $this->mapTransaction($transaction))->values()->all(),
        ]);
    }

    public function transactionDetail(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $transaction = $this->transactionsForUser($user)
            ->whereKey($id)
            ->firstOrFail();

        return response()->json([
            'message' => 'Detail transaksi berhasil dimuat.',
            'data' => $this->mapTransaction($transaction),
        ]);
    }

    public function location(ParkingLocation $parkingLocation): JsonResponse
    {
        $parkingLocation->load([
            'areas',
            'rates' => fn ($query) => $query->where('is_current', true)->with('vehicleType'),
        ]);

        return response()->json([
            'message' => 'Detail lokasi parkir berhasil dimuat.',
            'data' => $this->mapLocation($parkingLocation),
        ]);
    }

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'message' => 'Profil berhasil dimuat.',
            'data' => $this->formatUser($user),
        ]);
    }

    public function vehicleTypes(): JsonResponse
    {
        $vehicleTypes = VehicleType::query()
            ->orderBy('name')
            ->get(['id', 'name', 'description'])
            ->map(function (VehicleType $vehicleType) {
                return [
                    'id' => (string) $vehicleType->id,
                    'name' => $vehicleType->name,
                    'description' => $vehicleType->description,
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'message' => 'Tipe kendaraan berhasil dimuat.',
            'data' => $vehicleTypes,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'name.required' => 'Nama wajib diisi.',
            'name.string' => 'Nama harus berupa teks.',
            'name.max' => 'Nama maksimal 255 karakter.',
            'profile_photo.image' => 'Foto profil harus berupa gambar.',
            'profile_photo.mimes' => 'Foto profil harus berformat jpg, jpeg, png, atau webp.',
            'profile_photo.max' => 'Foto profil maksimal 4 MB.',
        ]);

        $user = $request->user();

        $payload = [
            'name' => $validated['name'],
        ];

        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo && ! filter_var($user->profile_photo, FILTER_VALIDATE_URL)) {
                Storage::disk('public')->delete($user->profile_photo);
            }

            $payload['profile_photo'] = $request->file('profile_photo')->storePublicly('profile-photos', 'public');
        }

        $user->update($payload);

        ActivityLog::create([
            'user_id' => $user->id,
            'activity' => 'Update profile mobile: ' . $user->name . ($request->hasFile('profile_photo') ? ' + photo' : ''),
            'activity_time' => now(),
        ]);

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'data' => $this->formatUser($user->refresh()),
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [
            'current_password.required' => 'Password awal wajib diisi.',
            'current_password.string' => 'Password awal harus berupa teks.',
            'password.required' => 'Password baru wajib diisi.',
            'password.string' => 'Password baru harus berupa teks.',
            'password.min' => 'Password baru minimal 6 karakter.',
            'password.confirmed' => 'Konfirmasi password baru tidak cocok.',
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'Password awal salah.',
            ]);
        }

        $user->update([
            'password' => $validated['password'],
        ]);

        ActivityLog::create([
            'user_id' => $user->id,
            'activity' => 'Change password mobile: ' . $user->name,
            'activity_time' => now(),
        ]);

        return response()->json([
            'message' => 'Password berhasil diperbarui.',
        ]);
    }

    public function bindRfid(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rfid_uid' => ['required', 'string', 'max:255'],
            'license_plate' => ['required', 'string', 'max:20'],
            'vehicle_type_id' => ['required', 'exists:vehicle_types,id'],
        ], [
            'rfid_uid.required' => 'RFID wajib diisi.',
            'rfid_uid.string' => 'RFID harus berupa teks.',
            'rfid_uid.max' => 'RFID maksimal 255 karakter.',
            'license_plate.required' => 'Plat kendaraan wajib diisi.',
            'license_plate.string' => 'Plat kendaraan harus berupa teks.',
            'license_plate.max' => 'Plat kendaraan maksimal 20 karakter.',
            'vehicle_type_id.required' => 'Tipe kendaraan wajib dipilih.',
            'vehicle_type_id.exists' => 'Tipe kendaraan tidak valid.',
        ]);

        $uid = strtoupper(trim((string) $validated['rfid_uid']));
        $plate = $this->formatPlate((string) $validated['license_plate']);
        $vehicleTypeId = (int) $validated['vehicle_type_id'];

        if ($uid === '') {
            throw ValidationException::withMessages([
                'rfid_uid' => 'RFID wajib diisi.',
            ]);
        }

        $user = $request->user();

        DB::transaction(function () use ($user, $uid, $plate, $vehicleTypeId) {
            $existingCard = RfidCard::query()
                ->whereRaw('UPPER(uid) = ?', [$uid])
                ->lockForUpdate()
                ->first();

            if ($existingCard && (int) $existingCard->user_id > 0 && (int) $existingCard->user_id !== (int) $user->id) {
                throw ValidationException::withMessages([
                    'rfid_uid' => 'RFID ini sudah terhubung ke akun lain.',
                ]);
            }

            $vehicle = (new VehicleService())->createVehicle([
                'license_plate' => $plate,
                'vehicle_type_id' => $vehicleTypeId,
                'user_id' => $user->id,
            ]);

            RfidCard::query()
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            if ($existingCard) {
                $existingCard->forceFill([
                    'user_id' => $user->id,
                    'is_active' => true,
                    'vehicle_id' => $vehicle->id,
                ])->save();
            } else {
                RfidCard::create([
                    'user_id' => $user->id,
                    'uid' => $uid,
                    'is_active' => true,
                    'vehicle_id' => $vehicle->id,
                ]);
            }

            ActivityLog::create([
                'user_id' => $user->id,
                'activity' => 'Bind RFID mobile: ' . $uid . ' + vehicle ' . $plate,
                'activity_time' => now(),
            ]);
        });

        return response()->json([
            'message' => 'RFID berhasil dihubungkan.',
            'data' => $this->formatUser($user->refresh()),
        ]);
    }
}