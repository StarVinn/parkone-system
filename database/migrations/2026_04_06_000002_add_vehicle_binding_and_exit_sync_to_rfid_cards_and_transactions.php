<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rfid_cards', function (Blueprint $table) {
            $table->foreignId('vehicle_id')
                ->nullable()
                ->after('user_id')
                ->constrained('vehicles')
                ->nullOnDelete();
            $table->unique('vehicle_id');
        });

        $assignedVehicleIds = [];
        $cards = DB::table('rfid_cards')
            ->select('id', 'user_id')
            ->orderBy('id')
            ->get();

        foreach ($cards as $card) {
            $vehicleId = DB::table('vehicles')
                ->where('user_id', $card->user_id)
                ->whereNotIn('id', $assignedVehicleIds)
                ->orderByDesc('id')
                ->value('id');

            if (! $vehicleId) {
                continue;
            }

            DB::table('rfid_cards')
                ->where('id', $card->id)
                ->update(['vehicle_id' => $vehicleId]);

            $assignedVehicleIds[] = $vehicleId;
        }

        Schema::table('transactions', function (Blueprint $table) {
            $table->enum('exit_sync_status', ['pending', 'synced', 'failed'])
                ->nullable()
                ->after('status');
            $table->timestamp('exit_synced_at')
                ->nullable()
                ->after('exit_sync_status');
            $table->text('exit_sync_error')
                ->nullable()
                ->after('exit_synced_at');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn([
                'exit_sync_status',
                'exit_synced_at',
                'exit_sync_error',
            ]);
        });

        Schema::table('rfid_cards', function (Blueprint $table) {
            $table->dropUnique(['vehicle_id']);
            $table->dropConstrainedForeignId('vehicle_id');
        });
    }
};
