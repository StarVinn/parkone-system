<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ParkingArea;
use App\Models\ParkingLocation;
use App\Models\ParkingRate;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleType;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $webLogins = ActivityLog::query()
            ->where('activity', 'like', 'User login%')
            ->where(function ($query) {
                $query->where('activity', 'User login')
                    ->orWhere('activity', 'like', '%(web)%');
            })
            ->count();

        $mobileLogins = ActivityLog::query()
            ->where('activity', 'like', 'User login%')
            ->where('activity', 'like', '%(mobile)%')
            ->count();

        $vehicleCreatedThisMonth = Vehicle::query()
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count();

        $parkingCreatedThisMonth = ParkingLocation::query()
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count()
            + ParkingArea::query()
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->count()
            + ParkingRate::query()
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->count();

        $locationTotal = ParkingLocation::query()->count();
        $areaTotal = ParkingArea::query()->count();
        $vehicleTypeTotal = VehicleType::query()->count();

        $expectedRateCombinations = $locationTotal * $vehicleTypeTotal;
        $configuredRateCombinations = ParkingRate::query()
            ->select('location_id', 'vehicle_type_id')
            ->distinct()
            ->count();
        $rateCoveragePercent = $expectedRateCombinations > 0
            ? (int) round(($configuredRateCombinations / $expectedRateCombinations) * 100)
            : 100;

        $locationRateTypeCounts = ParkingRate::query()
            ->select('location_id', DB::raw('COUNT(DISTINCT vehicle_type_id) as vehicle_type_count'))
            ->groupBy('location_id');

        $areasWithoutCompleteRates = $vehicleTypeTotal > 0
            ? ParkingArea::query()
                ->leftJoinSub($locationRateTypeCounts, 'location_rate_counts', function ($join) {
                    $join->on('parking_areas.parking_location_id', '=', 'location_rate_counts.location_id');
                })
                ->whereRaw('COALESCE(location_rate_counts.vehicle_type_count, 0) < ?', [$vehicleTypeTotal])
                ->count()
            : 0;

        $officerTotal = User::query()->where('role', 'officer')->count();
        $officerActive = User::query()
            ->where('role', 'officer')
            ->where('is_active', true)
            ->count();

        $duplicatePlateUnits = Vehicle::query()
            ->selectRaw("REPLACE(UPPER(license_plate), ' ', '') as canonical_plate, COUNT(*) as total")
            ->groupBy('canonical_plate')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->sum(fn ($item) => max(0, ((int) $item->total) - 1));

        $vehiclesWithInactiveOwner = 0;
        $invalidAreaCount = ParkingArea::query()
            ->where(function ($query) {
                $query->whereDoesntHave('location')
                    ->orWhere('capacity', '<=', 0)
                    ->orWhere('occupied', '<', 0)
                    ->orWhereColumn('occupied', '>', 'capacity');
            })
            ->count();
        $dataAlertTotal = $duplicatePlateUnits + $vehiclesWithInactiveOwner + $invalidAreaCount;

        return inertia('Admin/Dashboard', [
            'loginChart' => [
                'web' => $webLogins,
                'mobile' => $mobileLogins,
                'total' => $webLogins + $mobileLogins,
            ],
            'creationChart' => [
                'vehicle' => $vehicleCreatedThisMonth,
                'parking' => $parkingCreatedThisMonth,
            ],
            'adminCards' => [
                'setupReadiness' => [
                    'rate_coverage_percent' => $rateCoveragePercent,
                    'configured_rate_combinations' => $configuredRateCombinations,
                    'expected_rate_combinations' => $expectedRateCombinations,
                    'areas_without_complete_rates' => $areasWithoutCompleteRates,
                    'officer_active' => $officerActive,
                    'officer_total' => $officerTotal,
                    'data_alert_total' => $dataAlertTotal,
                ],
                'masterDataHealth' => [
                    'location_total' => $locationTotal,
                    'area_total' => $areaTotal,
                    'vehicle_type_total' => $vehicleTypeTotal,
                    'rate_completeness_percent' => $rateCoveragePercent,
                ],
            ],
        ]);
    }
}
