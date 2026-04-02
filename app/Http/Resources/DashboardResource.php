<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\JsonApi\JsonApiResource;
use Illuminate\Support\Collection;

class DashboardResource extends JsonApiResource
{
    private Collection $parkingLocations;
    private Collection $activeTransactions;
    private Collection $transactionHistory;

    public function __construct($resource)
    {
        parent::__construct($resource);

        $this->parkingLocations = collect();
        $this->activeTransactions = collect();
        $this->transactionHistory = collect();
    }

    public function parkingLocations($parkingLocations): self
    {
        $this->parkingLocations = collect($parkingLocations);

        return $this;
    }

    public function activeTransactions($activeTransactions): self
    {
        $this->activeTransactions = collect($activeTransactions);

        return $this;
    }

    public function transactionHistory($transactionHistory): self
    {
        $this->transactionHistory = collect($transactionHistory);

        return $this;
    }

    public function toId(Request $request)
    {
        return (string) $this->resource->getKey();
    }

    public function toType(Request $request)
    {
        return 'dashboard';
    }

    private function mapParkingLocations(): array
    {
        return $this->parkingLocations
            ->map(function ($location) {
                return [
                    'id' => (string) $location->id,
                    'name' => $location->name,
                    'latitude' => $location->latitude,
                    'longitude' => $location->longitude,
                    'description' => $location->description,
                    'areas' => collect($location->areas ?? [])->map(function ($area) {
                        return [
                            'id' => (string) $area->id,
                            'name' => $area->name,
                            'capacity' => $area->capacity,
                            'occupied' => $area->occupied,
                            'ticket_penalty' => $area->ticket_penalty,
                        ];
                    })->values()->all(),
                ];
            })
            ->values()
            ->all();
    }

    private function mapTransaction($transaction): array
    {
        return [
            'id' => (string) $transaction->id,
            'status' => $transaction->status,
            'entry_time' => optional($transaction->entry_time)->toISOString(),
            'exit_time' => optional($transaction->exit_time)->toISOString(),
            'total_hours' => $transaction->total_hours,
            'total_fee' => $transaction->total_fee,
            'rfid_uid' => $transaction->rfid_uid,
            'entry_vehicle_photo_url' => $transaction->entry_vehicle_photo_url,
            'user' => $transaction->relationLoaded('user') && $transaction->user ? [
                'id' => (string) $transaction->user->id,
                'name' => $transaction->user->name,
                'email' => $transaction->user->email,
                'role' => $transaction->user->role,
                'rfid_uid' => $transaction->user->rfid_uid,
                'status' => $transaction->user->status,
            ] : null,
            'vehicle' => $transaction->relationLoaded('vehicle') && $transaction->vehicle ? [
                'id' => (string) $transaction->vehicle->id,
                'license_plate' => $transaction->vehicle->license_plate,
                'vehicle_type' => $transaction->vehicle->relationLoaded('vehicleType') && $transaction->vehicle->vehicleType ? [
                    'id' => (string) $transaction->vehicle->vehicleType->id,
                    'name' => $transaction->vehicle->vehicleType->name,
                ] : null,
            ] : null,
            'parking_area' => $transaction->relationLoaded('parkingArea') && $transaction->parkingArea ? [
                'id' => (string) $transaction->parkingArea->id,
                'name' => $transaction->parkingArea->name,
                'capacity' => $transaction->parkingArea->capacity,
                'occupied' => $transaction->parkingArea->occupied,
                'location' => $transaction->parkingArea->relationLoaded('location') && $transaction->parkingArea->location ? [
                    'id' => (string) $transaction->parkingArea->location->id,
                    'name' => $transaction->parkingArea->location->name,
                ] : null,
            ] : null,
            'parking_rate' => $transaction->relationLoaded('parkingRate') && $transaction->parkingRate ? [
                'id' => (string) $transaction->parkingRate->id,
                'rate_type' => $transaction->parkingRate->rate_type,
                'rate_per_hour' => $transaction->parkingRate->rate_per_hour,
                'flat_rate' => $transaction->parkingRate->flat_rate,
                'location' => $transaction->parkingRate->relationLoaded('location') && $transaction->parkingRate->location ? [
                    'id' => (string) $transaction->parkingRate->location->id,
                    'name' => $transaction->parkingRate->location->name,
                ] : null,
                'vehicle_type' => $transaction->parkingRate->relationLoaded('vehicleType') && $transaction->parkingRate->vehicleType ? [
                    'id' => (string) $transaction->parkingRate->vehicleType->id,
                    'name' => $transaction->parkingRate->vehicleType->name,
                ] : null,
            ] : null,
            'rfid_card' => $transaction->relationLoaded('rfidCard') && $transaction->rfidCard ? [
                'id' => (string) $transaction->rfidCard->id,
                'uid' => $transaction->rfidCard->uid,
                'is_active' => (bool) $transaction->rfidCard->is_active,
            ] : null,
        ];
    }

    public function toAttributes(Request $request)
    {
        $userData = (new UserResource($this->resource))->resolve($request)['data'] ?? null;

        return [
            'user' => $userData,
            'parking_locations' => $this->mapParkingLocations(),
            'active_transactions' => $this->activeTransactions
                ->map(fn ($tx) => $this->mapTransaction($tx))
                ->values()
                ->all(),
            'transaction_history' => $this->transactionHistory
                ->map(fn ($tx) => $this->mapTransaction($tx))
                ->values()
                ->all(),
        ];
    }
}