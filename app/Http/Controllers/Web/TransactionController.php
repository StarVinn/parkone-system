<?php

namespace App\Http\Controllers\Web;

use App\Exceptions\VehicleNotRegisteredException;
use App\Http\Controllers\Controller;
use App\Http\Requests\TransactionRequest;
use App\Models\ParkingArea;
use App\Models\ParkingRate;
use App\Models\RfidCard;
use App\Models\Transaction;
use App\Models\Vehicle;
use App\Models\VehicleType;
use App\Services\TransactionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class TransactionController extends Controller
{
    public function index(Request $request, TransactionService $transactionService)
    {
        [$locationId, $areaId] = $this->resolveScope($request);

        return inertia('Officer/Dashboard', $transactionService->getOfficerDashboardData($locationId, $areaId));
    }

    public function standbyIn(Request $request, TransactionService $transactionService)
    {
        [$locationId, $areaId] = $this->resolveScope($request);
        if (!$areaId) {
            return redirect()->route('officer.dashboard')
                ->with('error', 'Pilih lokasi dan area parkir terlebih dahulu.');
        }

        $readiness = $transactionService->getAreaReadiness($areaId);
        if (!($readiness['entry_ready'] ?? false)) {
            return redirect()->route('officer.dashboard')
                ->with('error', 'Area belum siap untuk transaksi masuk: ' . implode(' ', $readiness['entry_blockers'] ?? []));
        }

        return inertia('Officer/StandbyIn', $transactionService->getOfficerDashboardData($locationId, $areaId));
    }

    public function standbyOut(Request $request, TransactionService $transactionService)
    {
        [$locationId, $areaId] = $this->resolveScope($request);
        if (!$areaId) {
            return redirect()->route('officer.dashboard')
                ->with('error', 'Pilih lokasi dan area parkir terlebih dahulu.');
        }

        return inertia('Officer/StandbyOut', $transactionService->getOfficerDashboardData($locationId, $areaId));
    }

    public function lookupVehiclesByRfid(Request $request)
    {
        $validated = $request->validate([
            'rfid_uid' => ['required', 'string', 'max:255'],
        ]);

        $rfid = trim($validated['rfid_uid']);
        $card = RfidCard::query()
            ->with([
                'user:id,name,email,is_active',
                'vehicle:id,license_plate,vehicle_type_id,user_id',
                'vehicle.vehicleType:id,name',
            ])
            ->whereRaw('UPPER(uid) = ?', [strtoupper($rfid)])
            ->where('is_active', true)
            ->first();

        if (!$card || !$card->user || !$card->user->is_active) {
            return response()->json([
                'message' => 'RFID tidak terdaftar.',
                'user' => null,
                'vehicles' => [],
            ], 404);
        }

        return response()->json([
            'message' => 'RFID ditemukan.',
            'user' => [
                'id' => $card->user->id,
                'name' => $card->user->name,
                'email' => $card->user->email,
                'rfid_uid' => $card->uid,
            ],
            'vehicle' => $card->vehicle ? [
                'id' => $card->vehicle->id,
                'license_plate' => $card->vehicle->license_plate,
                'vehicle_type' => $card->vehicle->relationLoaded('vehicleType') && $card->vehicle->vehicleType ? [
                    'id' => (string) $card->vehicle->vehicleType->id,
                    'name' => $card->vehicle->vehicleType->name,
                ] : null,
            ] : null,
            'vehicles' => $card->vehicle ? [$card->vehicle->id] : [],
        ]);
    }

    public function store(TransactionRequest $request, TransactionService $transactionService)
    {
        $validated = $request->validated();
        $action = $validated['action'];
        $requestedCheckoutMode = $validated['checkout_mode'] ?? 'ticket';
        $checkoutMode = in_array($requestedCheckoutMode, ['ticket', 'rfid'], true)
            ? $requestedCheckoutMode
            : 'ticket';
        $rfidUid = trim((string) ($validated['rfid_uid'] ?? ''));
        $validated['rfid_card_id'] = null;

        if ($rfidUid !== '') {
            $activeCard = RfidCard::query()
                ->whereRaw('UPPER(uid) = ?', [strtoupper($rfidUid)])
                ->where('is_active', true)
                ->whereHas('user', fn($query) => $query->where('is_active', true))
                ->first();

            if (!$activeCard) {
                throw ValidationException::withMessages([
                    'rfid_uid' => 'RFID tidak valid atau tidak aktif.',
                ]);
            }

            $validated['rfid_card_id'] = $activeCard->id;
        }

        try {
            if ($action === 'entry') {
                $readiness = $transactionService->getAreaReadiness((int) ($validated['parking_area_id'] ?? 0));
                if (!($readiness['entry_ready'] ?? false)) {
                    throw ValidationException::withMessages([
                        'parking_area_id' => 'Area belum siap untuk transaksi masuk: ' . implode(' ', $readiness['entry_blockers'] ?? []),
                    ]);
                }

                $validated['vehicle_photo'] = $request->file('vehicle_photo');
                $transaction = $transactionService->processEntry($validated, Auth::id());

                return redirect()->route('officer.transactions.receipt', [
                    'transaction' => $transaction->id,
                    'type' => 'entry',
                ]);
            }

            $transaction = $transactionService->processExit($validated, Auth::id());

            return redirect()->route('officer.transactions.receipt', [
                'transaction' => $transaction->id,
                'type' => 'exit',
                'checkout_mode' => $checkoutMode,
                'step' => 'payment',
            ]);
        } catch (VehicleNotRegisteredException $exception) {
            if ($action !== 'entry') {
                throw ValidationException::withMessages([
                    'license_plate' => 'Kendaraan tidak terdaftar untuk proses kendaraan keluar.',
                ]);
            }

            return back()->with('visitor_vehicle', [
                'license_plate' => $exception->normalizedPlate,
                'next_action' => $action,
                'parking_area_id' => $validated['parking_area_id'] ?? null,
                'rfid_uid' => $rfidUid !== '' ? strtoupper($rfidUid) : null,
            ]);
        }
    }

    public function showVisitorVehicleCreate(Request $request, TransactionService $transactionService)
    {
        $licensePlate = (string) $request->query('license_plate', '');
        $nextAction = (string) $request->query('next_action', 'entry');
        $parkingAreaId = (string) $request->query('parking_area_id', '');
        $parkingArea = $parkingAreaId
            ? ParkingArea::query()->with('location:id,name')->find($parkingAreaId)
            : null;

        $availableRates = collect();
        if ($parkingArea) {
            $availableRates = ParkingRate::query()
                ->with('vehicleType:id,name')
                ->where('location_id', $parkingArea->parking_location_id)
                ->get(['id', 'vehicle_type_id', 'location_id', 'rate_type', 'rate_per_hour', 'flat_rate']);
        }

        $availableVehicleTypeIds = $availableRates
            ->pluck('vehicle_type_id')
            ->unique()
            ->values();

        return inertia('Officer/VisitorVehicleCreate', [
            'licensePlate' => $licensePlate ? $transactionService->formatPlate($licensePlate) : '',
            'nextAction' => in_array($nextAction, ['entry', 'exit']) ? $nextAction : 'entry',
            'parkingAreaId' => $parkingAreaId,
            'parkingArea' => $parkingArea ? [
                'id' => $parkingArea->id,
                'name' => $parkingArea->name,
                'location_name' => $parkingArea->location?->name,
            ] : null,
            'availableRates' => $availableRates->map(function ($rate) {
                return [
                    'id' => $rate->id,
                    'vehicle_type_id' => $rate->vehicle_type_id,
                    'vehicle_type_name' => $rate->vehicleType?->name,
                    'rate_type' => $rate->rate_type,
                    'rate_per_hour' => $rate->rate_per_hour,
                    'flat_rate' => $rate->flat_rate,
                ];
            })->values(),
            'vehicleTypes' => VehicleType::query()
                ->select('id', 'name')
                ->when($parkingArea && $availableVehicleTypeIds->isNotEmpty(), fn($query) => $query->whereIn('id', $availableVehicleTypeIds))
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function storeVisitorVehicle(Request $request, TransactionService $transactionService)
    {
        $validated = $request->validate([
            'license_plate' => ['required', 'string', 'max:20', 'regex:/^[A-Za-z]{1,2}\s?[0-9]{1,4}\s?[A-Za-z]{1,3}$/'],
            'vehicle_type_id' => ['required', 'exists:vehicle_types,id'],
            'next_action' => ['nullable', 'in:entry,exit'],
            'parking_area_id' => ['nullable', 'exists:parking_areas,id'],
            'rfid_uid' => ['nullable', 'string', 'max:255'],
            'vehicle_photo' => ['required_if:next_action,entry', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ], [
            'license_plate.regex' => 'Format plat harus seperti "D 4512 I" atau "AD 45 ID".',
            'vehicle_type_id.required' => 'Tipe kendaraan wajib dipilih.',
            'vehicle_type_id.exists' => 'Tipe kendaraan tidak valid.',
            'parking_area_id.exists' => 'Area parkir tidak valid.',
            'rfid_uid.max' => 'RFID UID maksimal 255 karakter.',
            'vehicle_photo.required_if' => 'Foto kendaraan wajib diambil untuk kendaraan masuk.',
            'vehicle_photo.image' => 'Foto kendaraan harus berupa gambar.',
            'vehicle_photo.mimes' => 'Format foto kendaraan harus JPG, PNG, atau WEBP.',
            'vehicle_photo.max' => 'Ukuran foto kendaraan maksimal 4 MB.',
        ]);

        $plate = $transactionService->formatPlate($validated['license_plate']);
        $existingVehicle = Vehicle::query()
            ->whereRaw("REPLACE(UPPER(license_plate), ' ', '') = ?", [preg_replace('/[^A-Z0-9]/', '', strtoupper($plate))])
            ->first();

        if (!$existingVehicle) {
            Vehicle::create([
                'license_plate' => $plate,
                'vehicle_type_id' => $validated['vehicle_type_id'],
            ]);
        }

        $nextAction = $validated['next_action'] ?? 'entry';

        if ($nextAction === 'entry') {
            $rfidUid = strtoupper(trim((string) ($validated['rfid_uid'] ?? '')));
            $rfidCardId = null;
            if ($rfidUid !== '') {
                $activeCard = RfidCard::query()
                    ->whereRaw('UPPER(uid) = ?', [$rfidUid])
                    ->where('is_active', true)
                    ->whereHas('user', fn($query) => $query->where('is_active', true))
                    ->first();

                if (!$activeCard) {
                    throw ValidationException::withMessages([
                        'rfid_uid' => 'RFID tidak valid atau tidak aktif.',
                    ]);
                }

                $rfidCardId = $activeCard->id;
            }

            $parkingArea = ParkingArea::query()->find($validated['parking_area_id'] ?? null);
            if (!$parkingArea) {
                throw ValidationException::withMessages([
                    'parking_area_id' => 'Area parkir untuk transaksi masuk tidak ditemukan.',
                ]);
            }

            $rateExists = ParkingRate::query()
                ->where('location_id', $parkingArea->parking_location_id)
                ->where('vehicle_type_id', $validated['vehicle_type_id'])
                ->exists();

            if (!$rateExists) {
                throw ValidationException::withMessages([
                    'vehicle_type_id' => 'Tipe kendaraan ini belum punya tarif di lokasi area parkir yang dipilih.',
                ]);
            }

            $transaction = $transactionService->processEntry([
                'license_plate' => $plate,
                'parking_area_id' => (int) $validated['parking_area_id'],
                'rfid_card_id' => $rfidCardId,
                'vehicle_photo' => $request->file('vehicle_photo'),
            ], Auth::id());

            return redirect()->route('officer.transactions.receipt', [
                'transaction' => $transaction->id,
                'type' => 'entry',
            ]);
        }

        return redirect()->route('officer.dashboard')
            ->with('success', 'Kendaraan pendatang baru berhasil ditambahkan.');
    }

    public function showReceipt(Transaction $transaction, Request $request)
    {
        abort_unless(in_array($transaction->status, ['active', 'completed']), 404);

        $type = $request->query('type', $transaction->status === 'completed' ? 'exit' : 'entry');
        $type = in_array($type, ['entry', 'exit']) ? $type : 'entry';
        $checkoutMode = in_array($request->query('checkout_mode'), ['ticket', 'rfid'], true)
            ? $request->query('checkout_mode')
            : 'ticket';
        $step = in_array($request->query('step'), ['payment', 'preview'], true)
            ? $request->query('step')
            : 'preview';
        $receivedAmount = $request->query('received_amount');
        $receivedAmount = is_numeric($receivedAmount) ? (float) $receivedAmount : null;

        $transaction->load([
            'vehicle:id,license_plate,vehicle_type_id',
            'vehicle.vehicleType:id,name',
            'parkingArea:id,name,ticket_penalty',
            'parkingRate:id,rate_type,rate_per_hour,flat_rate',
            'rfidCard:id,uid,user_id',
        ]);

        $nominal = $type === 'exit' ? (float) ($transaction->total_fee ?? 0) : 0.0;
        $ticketPenalty = (float) ($transaction->parkingArea?->ticket_penalty ?? 10000);

        return inertia('Officer/Receipt', [
            'receiptType' => $type,
            'transaction' => $transaction,
            'nominal' => $nominal,
            'checkoutMode' => $checkoutMode,
            'ticketPenalty' => $ticketPenalty,
            'step' => $step,
            'receivedAmount' => $receivedAmount,
        ]);
    }

    public function confirmReceipt(Transaction $transaction, Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:entry,exit',
            'received_amount' => 'nullable|numeric|min:0',
            'checkout_mode' => 'nullable|in:ticket,rfid',
            'step' => 'nullable|in:payment,preview',
        ], [
            'received_amount.numeric' => 'Nominal uang masuk harus angka.',
            'received_amount.min' => 'Nominal uang masuk tidak boleh minus.',
            'checkout_mode.in' => 'Mode checkout tidak valid.',
            'step.in' => 'Langkah konfirmasi tidak valid.',
        ]);

        if ($validated['type'] === 'exit') {
            if ($request->input('received_amount') === null || $request->input('received_amount') === '') {
                throw ValidationException::withMessages([
                    'received_amount' => 'Nominal uang masuk wajib diisi.',
                ]);
            }

            $nominal = (float) ($transaction->total_fee ?? 0);
            $received = (float) $validated['received_amount'];
            $differenceInCents = (int) round(($received - $nominal) * 100);
            $ticketPenalty = (float) ($transaction->parkingArea?->ticket_penalty ?? 10000);
            $requestedCheckoutMode = $validated['checkout_mode'] ?? 'ticket';
            $checkoutMode = in_array($requestedCheckoutMode, ['ticket', 'rfid'], true)
                ? $requestedCheckoutMode
                : 'ticket';
            $step = in_array(($validated['step'] ?? 'payment'), ['payment', 'preview'], true)
                ? $validated['step']
                : 'payment';

            $allowedDifferenceInCents = [0];
            if ($checkoutMode === 'ticket') {
                $allowedDifferenceInCents[] = (int) round($ticketPenalty * 100);
            }

            if (!in_array($differenceInCents, $allowedDifferenceInCents, true)) {
                $difference = $differenceInCents / 100;
                $label = $difference > 0 ? 'uang lebih' : 'uang kurang';
                $gap = number_format(abs($difference), 0, ',', '.');
                $extraInfo = $checkoutMode === 'ticket'
                    ? ' (boleh pas atau + Rp ' . number_format($ticketPenalty, 0, ',', '.') . ' denda struk)'
                    : ' (harus pas untuk mode RFID)';

                throw ValidationException::withMessages([
                    'received_amount' => 'Nominal tidak sesuai (' . $label . ' Rp ' . $gap . ')' . $extraInfo . '.',
                ]);
            }

            if ($step === 'payment') {
                return redirect()->route('officer.transactions.receipt', [
                    'transaction' => $transaction->id,
                    'type' => 'exit',
                    'checkout_mode' => $checkoutMode,
                    'step' => 'preview',
                    'received_amount' => $received,
                ]);
            }
        }

        return redirect()->route('officer.dashboard')
            ->with('success', 'Konfirmasi struk berhasil.');
    }

    private function resolveScope(Request $request): array
    {
        $queryLocation = $request->query('location_id');
        $queryArea = $request->query('parking_area_id');

        if ($queryLocation !== null || $queryArea !== null) {
            $locationId = $queryLocation ? (int) $queryLocation : null;
            $areaId = $queryArea ? (int) $queryArea : null;
        } else {
            $locationId = $request->session()->get('officer.location_id');
            $areaId = $request->session()->get('officer.parking_area_id');
            $locationId = $locationId ? (int) $locationId : null;
            $areaId = $areaId ? (int) $areaId : null;
        }

        if ($areaId) {
            $area = ParkingArea::query()->find($areaId);

            if (!$area) {
                $locationId = null;
                $areaId = null;
            } else {
                if (!$locationId) {
                    $locationId = (int) $area->parking_location_id;
                }

                if ((int) $area->parking_location_id !== (int) $locationId) {
                    $areaId = null;
                }
            }
        }

        $request->session()->put('officer.location_id', $locationId);
        $request->session()->put('officer.parking_area_id', $areaId);

        return [$locationId, $areaId];
    }
}
