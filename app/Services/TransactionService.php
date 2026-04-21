<?php

namespace App\Services;

use App\Exceptions\VehicleNotRegisteredException;
use App\Models\ActivityLog;
use App\Models\ParkingArea;
use App\Models\ParkingLocation;
use App\Models\ParkingRate;
use App\Jobs\ProcessTransactionExitEventJob;
use App\Models\RfidCard;
use App\Models\TransactionExitEvent;
use App\Models\Transaction;
use App\Models\Vehicle;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TransactionService
{
    public function getAreaReadiness(?int $areaId = null): array
    {
        if (!$areaId) {
            return [
                'entry_ready' => false,
                'entry_blockers' => ['Pilih area parkir terlebih dahulu.'],
            ];
        }

        $area = ParkingArea::query()->find($areaId);
        if (!$area) {
            return [
                'entry_ready' => false,
                'entry_blockers' => ['Area parkir tidak ditemukan. Pilih area lain.'],
            ];
        }

        $entryBlockers = [];

        if ((int) $area->capacity <= 0) {
            $entryBlockers[] = 'Kapasitas area belum valid (harus lebih dari 0).';
        }

        if ((int) $area->occupied > (int) $area->capacity) {
            $entryBlockers[] = 'Data okupansi area tidak valid (occupied melebihi capacity).';
        }

        $hasRates = ParkingRate::query()
            ->where('location_id', $area->parking_location_id)
            ->where('is_current', true)
            ->exists();

        if (!$hasRates) {
            $entryBlockers[] = 'Tarif parkir untuk lokasi area ini belum tersedia.';
        }

        return [
            'entry_ready' => empty($entryBlockers),
            'entry_blockers' => $entryBlockers,
        ];
    }

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
                'rfidCard:id,uid,user_id,vehicle_id',
                'rfidCard.vehicle:id,license_plate,vehicle_type_id',
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
                'rfidCard:id,uid,user_id,vehicle_id',
                'rfidCard.vehicle:id,license_plate,vehicle_type_id',
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
                ->where('is_current', true)
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

        $readiness = $this->getAreaReadiness($selectedArea?->id);

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
            'readiness' => [
                'entry_ready' => (bool) ($readiness['entry_ready'] ?? false),
                'entry_blockers' => $readiness['entry_blockers'] ?? [],
            ],
        ];
    }

    public function processEntry(array $data, int $officerId): Transaction
    {
        return DB::transaction(function () use ($data, $officerId) {
            $plate = $this->formatPlate($data['license_plate']);
            $vehicle = $this->findVehicleByPlate($plate);
            $vehicle = Vehicle::query()->lockForUpdate()->findOrFail($vehicle->id);
            $rfidUid = strtoupper(trim((string) ($data['rfid_uid'] ?? '')));
            $rfidCardId = (int) ($data['rfid_card_id'] ?? 0);
            if ($rfidCardId <= 0 && $rfidUid !== '') {
                $rfidCardId = (int) (RfidCard::query()
                    ->whereRaw('UPPER(uid) = ?', [$rfidUid])
                    ->value('id') ?? 0);
            }

            if ($rfidCardId > 0) {
                $rfidCard = RfidCard::query()
                    ->with('vehicle:id,license_plate,vehicle_type_id')
                    ->lockForUpdate()
                    ->find($rfidCardId);

                if ($rfidCard) {
                    $this->bindRfidCardToVehicle($rfidCard, $vehicle, true);
                }
            }

            $existingActiveTransaction = Transaction::query()
                ->where('vehicle_id', $vehicle->id)
                ->where('status', 'active')
                ->first();

            if ($existingActiveTransaction) {
                throw ValidationException::withMessages([
                    'license_plate' => 'Kendaraan ini masih tercatat berada di area parkir.',
                ]);
            }

            if ($rfidCardId > 0) {
                $existingRfidActiveTransaction = Transaction::query()
                    ->where('rfid_card_id', $rfidCardId)
                    ->where('status', 'active')
                    ->first();

                if ($existingRfidActiveTransaction) {
                    throw ValidationException::withMessages([
                        'rfid_uid' => 'RFID ini sedang dipakai di transaksi aktif lain.',
                    ]);
                }
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
                ->where('is_current', true)
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
                'rfid_card_id' => $rfidCardId > 0 ? $rfidCardId : null,
                'parking_session_id' => (string) Str::uuid(),
                'parking_rate_rule_key_snapshot' => $parkingRate->pricing_rule_key,
                'parking_rate_version_number_snapshot' => $parkingRate->version_number,
                'rate_type_snapshot' => $parkingRate->rate_type,
                'rate_per_hour_snapshot' => $parkingRate->rate_per_hour,
                'first_hour_rate_snapshot' => $parkingRate->first_hour_rate,
                'next_hour_rate_snapshot' => $parkingRate->next_hour_rate,
                'grace_minutes_snapshot' => $parkingRate->grace_minutes,
                'flat_rate_snapshot' => $parkingRate->flat_rate,
                'entry_time' => now(),
                'entry_vehicle_photo_path' => $photoPath,
                'status' => 'active',
            ]);

            $parkingArea->update([
                'occupied' => max(0, (int) $parkingArea->occupied + 1),
            ]);

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
        $plate = $this->formatPlate($data['license_plate']);
        $rfidCardId = (int) ($data['rfid_card_id'] ?? 0);
        $sequenceScopeType = $rfidCardId > 0 ? 'rfid_card' : 'officer';
        $sequenceScopeKey = $rfidCardId > 0 ? (string) $rfidCardId : (string) $officerId;
        $sequenceNumber = $this->nextSequenceNumber($sequenceScopeType, $sequenceScopeKey);

        $exitEvent = TransactionExitEvent::create([
            'event_uuid' => (string) Str::uuid(),
            'event_type' => 'transaction.exit.requested',
            'sequence_scope_type' => $sequenceScopeType,
            'sequence_scope_key' => $sequenceScopeKey,
            'sequence_number' => $sequenceNumber,
            'occurred_at' => now(),
            'received_at' => now(),
            'officer_id' => $officerId,
            'license_plate' => $plate,
            'rfid_card_id' => $rfidCardId > 0 ? $rfidCardId : null,
            'payload' => $data,
            'status' => 'pending',
        ]);

        try {
            return DB::transaction(function () use ($data, $officerId, $exitEvent, $plate, $rfidCardId) {
                $vehicle = $this->findVehicleByPlate($plate);
                $vehicle = Vehicle::query()->lockForUpdate()->findOrFail($vehicle->id);
                $rfidUid = strtoupper(trim((string) ($data['rfid_uid'] ?? '')));
                if ($rfidCardId <= 0 && $rfidUid !== '') {
                    $rfidCardId = (int) (RfidCard::query()
                        ->whereRaw('UPPER(uid) = ?', [$rfidUid])
                        ->value('id') ?? 0);
                }

                if ($rfidCardId > 0) {
                    $rfidCard = RfidCard::query()
                        ->with('vehicle:id,license_plate,vehicle_type_id')
                        ->lockForUpdate()
                        ->find($rfidCardId);

                    if ($rfidCard) {
                        $this->assertRfidCardMatchesVehicle($rfidCard, $vehicle);
                    }
                }

                $transaction = Transaction::query()
                    ->with(['parkingArea', 'parkingRate'])
                    ->where('vehicle_id', $vehicle->id)
                    ->where('status', 'active')
                    ->lockForUpdate()
                    ->latest('entry_time')
                    ->first();

                if (!$transaction) {
                    throw ValidationException::withMessages([
                        'license_plate' => 'Tidak ada transaksi aktif untuk plat nomor ini.',
                    ]);
                }

                $entryRfidCardId = (int) ($transaction->rfid_card_id ?? 0);
                if ($entryRfidCardId > 0) {
                    if ($rfidCardId <= 0) {
                        throw ValidationException::withMessages([
                            'rfid_uid' => 'RFID wajib diisi karena transaksi masuk menggunakan RFID.',
                        ]);
                    }

                    if ($entryRfidCardId !== $rfidCardId) {
                        throw ValidationException::withMessages([
                            'rfid_uid' => 'RFID tidak sesuai dengan transaksi masuk kendaraan ini.',
                        ]);
                    }
                }

                $exitTime = now();
                $entryTime = $transaction->entry_time instanceof Carbon
                    ? $transaction->entry_time
                    : Carbon::parse($transaction->entry_time);
                $seconds = max(0, $entryTime->diffInSeconds($exitTime));
                $hours = $this->calculateHours($entryTime, $exitTime);
                $totalFee = $this->calculateFeeFromTransaction($transaction, $seconds);

                $transaction->update([
                    'exit_time' => $exitTime,
                    'total_hours' => $hours,
                    'total_fee' => $totalFee,
                    'status' => 'completed',
                    'exit_sync_status' => 'synced',
                    'exit_synced_at' => now(),
                    'exit_sync_error' => null,
                ]);

                $exitEvent->forceFill([
                    'transaction_id' => $transaction->id,
                    'parking_session_id' => $transaction->parking_session_id,
                    'status' => 'completed',
                    'processed_at' => now(),
                    'error_message' => null,
                ])->save();

                ProcessTransactionExitEventJob::dispatch($exitEvent->id)->afterCommit();

                if ($transaction->parkingArea) {
                    $parkingArea = ParkingArea::query()
                        ->lockForUpdate()
                        ->find($transaction->parkingArea->id);

                    if ($parkingArea && $parkingArea->occupied > 0) {
                        $parkingArea->update([
                            'occupied' => max(0, (int) $parkingArea->occupied - 1),
                        ]);
                    }
                }

                ActivityLog::create([
                    'user_id' => $officerId,
                    'activity' => 'Check-out kendaraan: ' . $plate . ', biaya: Rp ' . number_format($totalFee, 0, ',', '.'),
                    'activity_time' => now(),
                ]);

                return $transaction->fresh(['vehicle', 'parkingArea', 'parkingRate']);
            });
        } catch (\Throwable $throwable) {
            $exitEvent->forceFill([
                'status' => 'failed',
                'processed_at' => now(),
                'error_message' => Str::limit($throwable->getMessage(), 2000),
            ])->save();

            throw $throwable;
        }
    }

    public function previewExitCharge(Transaction $transaction, ?Carbon $at = null): array
    {
        $exitTime = $at ?? now();
        $entryTime = $transaction->entry_time instanceof Carbon
            ? $transaction->entry_time
            : Carbon::parse($transaction->entry_time);
        $seconds = max(0, $entryTime->diffInSeconds($exitTime));
        $hours = $this->calculateHours($entryTime, $exitTime);

        return [
            'hours' => $hours,
            'total_fee' => $this->calculateFeeFromTransaction($transaction, $seconds),
            'exit_time' => $exitTime->toDateTimeString(),
        ];
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
        $seconds = (int) max(0, round($hours * 3600));
        $graceMinutes = max(0, (int) ($rate->grace_minutes ?? 0));

        if ($rate->rate_type === 'flat') {
            return $this->calculateFlatFeeWithGrace(
                $seconds,
                $graceMinutes,
                (float) ($rate->flat_rate ?? 0),
            );
        }

        $firstHourRate = (float) ($rate->first_hour_rate ?? $rate->rate_per_hour ?? 0);
        $nextHourRate = (float) ($rate->next_hour_rate ?? $rate->rate_per_hour ?? $firstHourRate);

        return $this->calculateProgressiveHourlyFee(
            $seconds,
            $graceMinutes,
            $firstHourRate,
            $nextHourRate,
        );
    }

    private function calculateFeeFromTransaction(Transaction $transaction, int $durationSeconds): float
    {
        $rateType = (string) ($transaction->rate_type_snapshot ?? '');
        $flatRate = (float) ($transaction->flat_rate_snapshot ?? 0);
        $ratePerHour = (float) ($transaction->rate_per_hour_snapshot ?? 0);
        $firstHourRateSnapshot = (float) ($transaction->first_hour_rate_snapshot ?? 0);
        $nextHourRateSnapshot = (float) ($transaction->next_hour_rate_snapshot ?? 0);
        $graceMinutesSnapshot = max(0, (int) ($transaction->grace_minutes_snapshot ?? 0));

        if ($rateType === '') {
            if (!$transaction->relationLoaded('parkingRate') || !$transaction->parkingRate) {
                $transaction->loadMissing('parkingRate');
            }

            if (!$transaction->parkingRate) {
                return 0.0;
            }

            $rate = $transaction->parkingRate;
            if ($rate->rate_type === 'flat') {
                return $this->calculateFlatFeeWithGrace(
                    $durationSeconds,
                    max(0, (int) ($rate->grace_minutes ?? 0)),
                    (float) ($rate->flat_rate ?? 0),
                );
            }

            $graceMinutes = max(0, (int) ($rate->grace_minutes ?? 0));
            $firstHourRate = (float) ($rate->first_hour_rate ?? $rate->rate_per_hour ?? 0);
            $nextHourRate = (float) ($rate->next_hour_rate ?? $rate->rate_per_hour ?? $firstHourRate);

            return $this->calculateProgressiveHourlyFee(
                $durationSeconds,
                $graceMinutes,
                $firstHourRate,
                $nextHourRate,
            );
        }

        if ($rateType === 'flat') {
            return $this->calculateFlatFeeWithGrace(
                $durationSeconds,
                $graceMinutesSnapshot,
                $flatRate,
            );
        }

        $firstHourRate = $firstHourRateSnapshot > 0 ? $firstHourRateSnapshot : $ratePerHour;
        $nextHourRate = $nextHourRateSnapshot > 0
            ? $nextHourRateSnapshot
            : ($ratePerHour > 0 ? $ratePerHour : $firstHourRate);

        return $this->calculateProgressiveHourlyFee(
            $durationSeconds,
            $graceMinutesSnapshot,
            $firstHourRate,
            $nextHourRate,
        );
    }

    private function calculateFlatFeeWithGrace(
        int $durationSeconds,
        int $graceMinutes,
        float $flatRate,
    ): float {
        $seconds = max(0, $durationSeconds);
        $graceSeconds = max(0, $graceMinutes) * 60;

        if ($seconds <= $graceSeconds) {
            return 0.0;
        }

        return (float) max(0, $flatRate);
    }

    private function calculateProgressiveHourlyFee(
        int $durationSeconds,
        int $graceMinutes,
        float $firstHourRate,
        float $nextHourRate,
    ): float {
        $seconds = max(0, $durationSeconds);
        $graceSeconds = max(0, $graceMinutes) * 60;

        if ($seconds <= $graceSeconds) {
            return 0.0;
        }

        $billableSeconds = $seconds - $graceSeconds;
        if ($billableSeconds <= 3600) {
            return (float) max(0, $firstHourRate);
        }

        $remainingSeconds = max(0, $billableSeconds - 3600);
        $extraHours = (int) ceil($remainingSeconds / 3600);

        return (float) max(0, $firstHourRate) + ((float) max(0, $nextHourRate) * $extraHours);
    }

    private function bindRfidCardToVehicle(RfidCard $rfidCard, Vehicle $vehicle, bool $strict = true): void
    {
        $boundVehicleId = (int) ($rfidCard->vehicle_id ?? 0);

        if ($boundVehicleId > 0 && $boundVehicleId !== (int) $vehicle->id) {
            throw ValidationException::withMessages([
                'rfid_uid' => 'RFID ini sudah terikat ke kendaraan lain.',
            ]);
        }

        if ($boundVehicleId <= 0) {
            $rfidCard->forceFill([
                'vehicle_id' => $vehicle->id,
            ])->save();
        }

        if ($strict && (int) $rfidCard->vehicle_id !== (int) $vehicle->id) {
            throw ValidationException::withMessages([
                'rfid_uid' => 'RFID ini tidak cocok dengan kendaraan yang dipilih.',
            ]);
        }
    }

    private function assertRfidCardMatchesVehicle(RfidCard $rfidCard, Vehicle $vehicle): void
    {
        $boundVehicleId = (int) ($rfidCard->vehicle_id ?? 0);

        if ($boundVehicleId > 0 && $boundVehicleId !== (int) $vehicle->id) {
            throw ValidationException::withMessages([
                'rfid_uid' => 'RFID ini sudah terikat ke kendaraan lain.',
            ]);
        }
    }

    private function nextSequenceNumber(string $scopeType, string $scopeKey): int
    {
        return DB::transaction(function () use ($scopeType, $scopeKey) {
            $sequence = DB::table('event_sequences')
                ->where('scope_type', $scopeType)
                ->where('scope_key', $scopeKey)
                ->lockForUpdate()
                ->first();

            if (!$sequence) {
                DB::table('event_sequences')->insert([
                    'scope_type' => $scopeType,
                    'scope_key' => $scopeKey,
                    'current_sequence' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                return 1;
            }

            $nextSequence = ((int) $sequence->current_sequence) + 1;

            DB::table('event_sequences')
                ->where('scope_type', $scopeType)
                ->where('scope_key', $scopeKey)
                ->update([
                    'current_sequence' => $nextSequence,
                    'updated_at' => now(),
                ]);

            return $nextSequence;
        });
    }
}
