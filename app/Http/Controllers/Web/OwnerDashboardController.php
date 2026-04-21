<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ParkingArea;
use App\Models\ParkingLocation;
use App\Models\ParkingRate;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class OwnerDashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = now()->startOfDay();
        $ownerLocationIds = $this->ownerLocationIds($request);
        $selectedLocationId = $this->resolveSelectedLocationId(
            (int) $request->query('location_id', 0),
            $ownerLocationIds,
        );

        $completedTodayQuery = $this->scopedTransactionQuery($ownerLocationIds)
            ->where('status', 'completed')
            ->where('exit_time', '>=', $today);

        $vehicleInToday = $this->scopedTransactionQuery($ownerLocationIds)
            ->where('entry_time', '>=', $today)
            ->count();

        $vehicleOutToday = (clone $completedTodayQuery)->count();

        $revenueToday = (float) (clone $completedTodayQuery)->sum('total_fee');

        $areaTotals = ParkingArea::query()
            ->when(
                !empty($ownerLocationIds),
                fn ($query) => $query->whereIn('parking_location_id', $ownerLocationIds),
                fn ($query) => $query->whereRaw('1 = 0'),
            )
            ->selectRaw('COALESCE(SUM(capacity), 0) as capacity_total, COALESCE(SUM(occupied), 0) as occupied_total')
            ->first();

        $capacityTotal = (int) ($areaTotals?->capacity_total ?? 0);
        $occupiedTotal = (int) ($areaTotals?->occupied_total ?? 0);
        $occupancyPercent = $capacityTotal > 0
            ? (int) round(($occupiedTotal / $capacityTotal) * 100)
            : 0;

        $charts = $this->buildCharts($occupancyPercent, $ownerLocationIds);

        return inertia('Owner/Dashboard', [
            'todaySummary' => [
                'occupancy_percent' => $occupancyPercent,
                'vehicle_in' => $vehicleInToday,
                'vehicle_out' => $vehicleOutToday,
                'revenue' => $revenueToday,
                'failed_transactions' => 0,
            ],
            'charts' => $charts,

            // Lazy props (queried only when requested via partial reload)
            'topLocations' => Inertia::lazy(fn () => $this->getTopLocations($ownerLocationIds)),
            'alerts' => Inertia::lazy(fn () => $this->getAlerts($ownerLocationIds)),
            'recentTransactions' => Inertia::lazy(fn () => $this->getRecentTransactions($ownerLocationIds)),
            'locationDetail' => $this->getLocationDetail($selectedLocationId, $ownerLocationIds),
        ]);
    }

    private function ownerLocationIds(Request $request): array
    {
        $ownerId = (int) ($request->user()?->id ?? 0);
        if ($ownerId <= 0) {
            return [];
        }

        return ParkingLocation::query()
            ->where('owner_id', $ownerId)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }

    private function resolveSelectedLocationId(int $requestedId, array $ownerLocationIds): int
    {
        if (!empty($ownerLocationIds) && in_array($requestedId, $ownerLocationIds, true)) {
            return $requestedId;
        }

        return (int) ($ownerLocationIds[0] ?? 0);
    }

    private function scopedTransactionQuery(array $ownerLocationIds)
    {
        return Transaction::query()
            ->whereHas('parkingArea', function ($query) use ($ownerLocationIds) {
                if (empty($ownerLocationIds)) {
                    $query->whereRaw('1 = 0');

                    return;
                }

                $query->whereIn('parking_location_id', $ownerLocationIds);
            });
    }

    private function buildCharts(int $occupancyPercent, array $ownerLocationIds): array
    {
        $days = 30;
        $from = now()->subDays($days - 1)->startOfDay();
        $to = now()->endOfDay();

        $rawRevenue = $this->scopedTransactionQuery($ownerLocationIds)
            ->where('status', 'completed')
            ->whereBetween('exit_time', [$from, $to])
            ->selectRaw('DATE(exit_time) as day, COALESCE(SUM(total_fee), 0) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $labels = [];
        $revenue = [];
        $occupancy = [];

        for ($i = 0; $i < $days; $i += 1) {
            $date = (clone $from)->addDays($i);
            $dayKey = $date->toDateString();
            $labels[] = $date->translatedFormat('d M');
            $revenue[] = (float) ($rawRevenue[$dayKey] ?? 0);
            $occupancy[] = $occupancyPercent;
        }

        return [
            'labels' => $labels,
            'revenue' => $revenue,
            'occupancy' => $occupancy,
        ];
    }

    private function getParkingLocations(array $ownerLocationIds): array
    {
        return ParkingLocation::query()
            ->whereIn('id', $ownerLocationIds)
            ->select('id', 'name', 'latitude', 'longitude', 'description')
            ->withSum('areas as capacity_total', 'capacity')
            ->withSum('areas as occupied_total', 'occupied')
            ->orderBy('name')
            ->limit(50)
            ->get()
            ->map(fn (ParkingLocation $location) => [
                'id' => $location->id,
                'name' => $location->name,
                'latitude' => $location->latitude,
                'longitude' => $location->longitude,
                'description' => $location->description,
                'capacity' => (int) ($location->capacity_total ?? 0),
                'occupied' => (int) ($location->occupied_total ?? 0),
            ])
            ->all();
    }

    private function getTopLocations(array $ownerLocationIds): array
    {
        if (empty($ownerLocationIds)) {
            return [];
        }

        $from = now()->subDays(6)->startOfDay();

        $rows = Transaction::query()
            ->join('parking_areas', 'transactions.parking_area_id', '=', 'parking_areas.id')
            ->join('parking_locations', 'parking_areas.parking_location_id', '=', 'parking_locations.id')
            ->whereIn('parking_locations.id', $ownerLocationIds)
            ->where('transactions.status', 'completed')
            ->where('transactions.exit_time', '>=', $from)
            ->select('parking_areas.id', 'parking_areas.name as area_name', 'parking_locations.name as location_name')
            ->selectRaw('COUNT(transactions.id) as visits_count')
            ->selectRaw('COALESCE(SUM(transactions.total_fee), 0) as revenue')
            ->groupBy('parking_areas.id', 'parking_areas.name', 'parking_locations.name')
            ->orderByDesc('visits_count')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();

        return $rows->map(function ($row) {
            return [
                'id' => (int) $row->id,
                'name' => (string) $row->area_name,
                'location_name' => (string) $row->location_name,
                'visits_count' => (int) ($row->visits_count ?? 0),
                'revenue' => (float) ($row->revenue ?? 0),
            ];
        })->all();
    }

    private function getAlerts(array $ownerLocationIds): array
    {
        if (empty($ownerLocationIds)) {
            return [];
        }

        $alerts = [];

        $fullAreas = ParkingArea::query()
            ->with('location:id,name')
            ->whereIn('parking_location_id', $ownerLocationIds)
            ->where('capacity', '>', 0)
            ->whereRaw('(occupied / capacity) >= 0.95')
            ->orderByRaw('(occupied / capacity) desc')
            ->limit(8)
            ->get(['id', 'name', 'parking_location_id', 'capacity', 'occupied']);

        foreach ($fullAreas as $area) {
            $capacity = (int) $area->capacity;
            $occupied = (int) $area->occupied;
            $percent = $capacity > 0 ? (int) round(($occupied / $capacity) * 100) : 0;

            $alerts[] = [
                'severity' => $percent >= 99 ? 'high' : 'medium',
                'title' => 'Slot hampir penuh',
                'detail' => sprintf(
                    '%s - %s: %d/%d (%d%%).',
                    (string) ($area->location?->name ?? 'Lokasi'),
                    (string) $area->name,
                    $occupied,
                    $capacity,
                    $percent,
                ),
            ];
        }

        $invalidAreas = ParkingArea::query()
            ->with('location:id,name')
            ->whereIn('parking_location_id', $ownerLocationIds)
            ->where(function ($query) {
                $query->where('capacity', '<=', 0)
                    ->orWhere('occupied', '<', 0)
                    ->orWhereColumn('occupied', '>', 'capacity');
            })
            ->orderBy('updated_at', 'desc')
            ->limit(4)
            ->get(['id', 'name', 'parking_location_id', 'capacity', 'occupied']);

        foreach ($invalidAreas as $area) {
            $alerts[] = [
                'severity' => 'medium',
                'title' => 'Data area tidak valid',
                'detail' => sprintf(
                    '%s - %s: capacity=%s, occupied=%s.',
                    (string) ($area->location?->name ?? 'Lokasi'),
                    (string) $area->name,
                    (string) $area->capacity,
                    (string) $area->occupied,
                ),
            ];
        }

        return array_slice($alerts, 0, 10);
    }

    private function getRecentTransactions(array $ownerLocationIds): array
    {
        return $this->scopedTransactionQuery($ownerLocationIds)
            ->with([
                'user:id,name',
                'vehicle:id,license_plate,vehicle_type_id',
                'vehicle.vehicleType:id,name',
                'parkingArea:id,name,parking_location_id',
                'parkingArea.location:id,name',
                'parkingRate:id,rate_type,rate_per_hour,flat_rate',
                'rfidCard:id,uid,vehicle_id',
            ])
            ->latest('exit_time')
            ->limit(25)
            ->get([
                'id',
                'user_id',
                'vehicle_id',
                'parking_area_id',
                'parking_rate_id',
                'entry_time',
                'entry_vehicle_photo_path',
                'exit_time',
                'total_hours',
                'total_fee',
                'parking_rate_rule_key_snapshot',
                'parking_rate_version_number_snapshot',
                'rate_type_snapshot',
                'rate_per_hour_snapshot',
                'flat_rate_snapshot',
                'exit_sync_status',
                'exit_synced_at',
                'exit_sync_error',
                'status',
            ])
            ->map(fn (Transaction $tx) => [
                'id' => (string) $tx->id,
                'user_name' => (string) ($tx->user?->name ?? '-'),
                'time' => $tx->exit_time
                    ? Carbon::parse($tx->exit_time)->format('Y-m-d H:i')
                    : Carbon::parse($tx->entry_time)->format('Y-m-d H:i'),
                'entry_time' => Carbon::parse($tx->entry_time)->format('Y-m-d H:i'),
                'exit_time' => $tx->exit_time
                    ? Carbon::parse($tx->exit_time)->format('Y-m-d H:i')
                    : '-',
                'location' => (string) ($tx->parkingArea?->location?->name ?? '-'),
                'parking_area' => (string) ($tx->parkingArea?->name ?? '-'),
                'plate' => (string) ($tx->vehicle?->license_plate ?? '-'),
                'vehicle' => (string) ($tx->vehicle?->vehicleType?->name ?? '-'),
                'payment' => '-',
                'total' => (float) ($tx->total_fee ?? 0),
                'total_hours' => (float) ($tx->total_hours ?? 0),
                'parking_rate_rule_key_snapshot' => (string) ($tx->parking_rate_rule_key_snapshot ?? '-'),
                'parking_rate_version_number_snapshot' => $tx->parking_rate_version_number_snapshot,
                'rate_type_snapshot' => (string) ($tx->rate_type_snapshot ?? '-'),
                'rate_per_hour_snapshot' => (float) ($tx->rate_per_hour_snapshot ?? 0),
                'flat_rate_snapshot' => (float) ($tx->flat_rate_snapshot ?? 0),
                'rfid_uid' => (string) ($tx->rfid_uid ?? '-'),
                'entry_vehicle_photo_url' => $tx->entry_vehicle_photo_url,
                'exit_sync_status' => (string) ($tx->exit_sync_status ?? '-'),
                'exit_synced_at' => $tx->exit_synced_at
                    ? Carbon::parse($tx->exit_synced_at)->format('Y-m-d H:i')
                    : '-',
                'exit_sync_error' => (string) ($tx->exit_sync_error ?? ''),
                'status' => (string) ($tx->status ?? '-'),
            ])
            ->all();
    }

    private function getLocationDetail(int $locationId, array $ownerLocationIds): ?array
    {
        if ($locationId <= 0 || !in_array($locationId, $ownerLocationIds, true)) {
            return null;
        }

        $location = ParkingLocation::query()
            ->select('id', 'name', 'latitude', 'longitude', 'description')
            ->with([
                'areas' => fn ($query) => $query
                    ->select('id', 'name', 'parking_location_id', 'capacity', 'occupied')
                    ->orderBy('name')
                    ->limit(60),
                'rates' => fn ($query) => $query
                    ->with('vehicleType:id,name')
                    ->select(
                        'id',
                        'location_id',
                        'vehicle_type_id',
                        'rate_type',
                        'rate_per_hour',
                        'first_hour_rate',
                        'next_hour_rate',
                        'grace_minutes',
                        'flat_rate',
                    )
                    ->orderBy('vehicle_type_id')
                    ->limit(60),
            ])
            ->find($locationId);

        if (!$location) {
            return null;
        }

        $areas = $location->areas->map(fn ($area) => [
            'id' => $area->id,
            'name' => $area->name,
            'capacity' => (int) $area->capacity,
            'occupied' => (int) $area->occupied,
        ])->all();

        $rates = $location->rates->map(fn (ParkingRate $rate) => [
            'id' => $rate->id,
            'vehicle_type' => (string) ($rate->vehicleType?->name ?? '-'),
            'rate_type' => (string) $rate->rate_type,
            'rate_per_hour' => (float) ($rate->rate_per_hour ?? 0),
            'first_hour_rate' => (float) ($rate->first_hour_rate ?? $rate->rate_per_hour ?? 0),
            'next_hour_rate' => (float) ($rate->next_hour_rate ?? $rate->rate_per_hour ?? 0),
            'grace_minutes' => (int) ($rate->grace_minutes ?? 0),
            'flat_rate' => (float) ($rate->flat_rate ?? 0),
        ])->all();

        $capacityTotal = (int) collect($areas)->sum('capacity');
        $occupiedTotal = (int) collect($areas)->sum('occupied');
        $occupancyPercent = $capacityTotal > 0
            ? (int) round(($occupiedTotal / $capacityTotal) * 100)
            : 0;

        return [
            'id' => $location->id,
            'name' => $location->name,
            'latitude' => $location->latitude,
            'longitude' => $location->longitude,
            'description' => $location->description,
            'capacity_total' => $capacityTotal,
            'occupied_total' => $occupiedTotal,
            'occupancy_percent' => $occupancyPercent,
            'areas' => $areas,
            'rates' => $rates,
        ];
    }
}
