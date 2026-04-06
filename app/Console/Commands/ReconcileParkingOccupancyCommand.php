<?php

namespace App\Console\Commands;

use App\Models\ParkingArea;
use App\Models\Transaction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReconcileParkingOccupancyCommand extends Command
{
    protected $signature = 'parking:reconcile-occupancy {--dry-run : Show drift without applying fixes}';

    protected $description = 'Compare active transactions with occupied counts and fix drift';

    public function handle(): int
    {
        $this->info('Memulai rekonsiliasi okupansi...');

        $activeCounts = Transaction::query()
            ->where('status', 'active')
            ->select('parking_area_id', DB::raw('COUNT(*) as active_count'))
            ->groupBy('parking_area_id')
            ->pluck('active_count', 'parking_area_id');

        $dryRun = (bool) $this->option('dry-run');
        $anomalies = 0;

        DB::transaction(function () use ($activeCounts, $dryRun, &$anomalies) {
            $areas = ParkingArea::query()
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            foreach ($areas as $area) {
                $expected = (int) ($activeCounts[$area->id] ?? 0);
                $actual = (int) $area->occupied;

                if ($expected === $actual) {
                    continue;
                }

                $delta = $expected - $actual;
                $anomalies++;

                Log::warning('parking_occupancy_drift_detected', [
                    'parking_area_id' => $area->id,
                    'parking_area_name' => $area->name,
                    'expected' => $expected,
                    'actual' => $actual,
                    'delta' => $delta,
                    'dry_run' => $dryRun,
                ]);

                if ($dryRun) {
                    continue;
                }

                $area->update([
                    'occupied' => $expected,
                ]);
            }
        });

        if ($anomalies > 0) {
            Log::warning('parking_occupancy_reconciliation_completed_with_drift', [
                'anomaly_count' => $anomalies,
                'dry_run' => $dryRun,
            ]);

            if ($anomalies >= 5) {
                Log::critical('parking_occupancy_reconciliation_threshold_reached', [
                    'anomaly_count' => $anomalies,
                    'dry_run' => $dryRun,
                ]);
            }
        } else {
            Log::info('parking_occupancy_reconciliation_clean', [
                'dry_run' => $dryRun,
            ]);
        }

        $this->info($anomalies > 0 ? 'Rekonsiliasi selesai dengan drift yang diperbaiki/tercatat.' : 'Rekonsiliasi selesai tanpa drift.');

        return self::SUCCESS;
    }
}
