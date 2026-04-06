<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parking_rates', function (Blueprint $table) {
            $table->string('pricing_rule_key')->nullable()->after('vehicle_type_id');
            $table->unsignedInteger('version_number')->default(1)->after('pricing_rule_key');
            $table->boolean('is_current')->default(true)->after('version_number');
        });

        DB::table('parking_rates')
            ->orderBy('id')
            ->get()
            ->each(function ($parkingRate) {
                DB::table('parking_rates')
                    ->where('id', $parkingRate->id)
                    ->update([
                        'pricing_rule_key' => (string) Str::uuid(),
                        'version_number' => 1,
                        'is_current' => true,
                    ]);
            });

        Schema::table('transactions', function (Blueprint $table) {
            $table->string('parking_rate_rule_key_snapshot')->nullable()->after('parking_rate_id');
            $table->unsignedInteger('parking_rate_version_number_snapshot')->nullable()->after('parking_rate_rule_key_snapshot');
        });

        DB::statement(
            'UPDATE transactions t
             INNER JOIN parking_rates pr ON pr.id = t.parking_rate_id
             SET t.parking_rate_rule_key_snapshot = pr.pricing_rule_key,
                 t.parking_rate_version_number_snapshot = pr.version_number
             WHERE t.parking_rate_rule_key_snapshot IS NULL'
        );

        Schema::table('transaction_exit_events', function (Blueprint $table) {
            $table->uuid('event_uuid')->nullable()->after('id');
            $table->string('event_type')->nullable()->after('event_uuid');
            $table->unsignedBigInteger('sequence_number')->nullable()->after('event_type');
            $table->timestamp('occurred_at')->nullable()->after('sequence_number');
            $table->unique('event_uuid');
        });
    }

    public function down(): void
    {
        Schema::table('transaction_exit_events', function (Blueprint $table) {
            $table->dropUnique(['event_uuid']);
            $table->dropColumn([
                'event_uuid',
                'event_type',
                'sequence_number',
                'occurred_at',
            ]);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn([
                'parking_rate_rule_key_snapshot',
                'parking_rate_version_number_snapshot',
            ]);
        });

        Schema::table('parking_rates', function (Blueprint $table) {
            $table->dropColumn([
                'pricing_rule_key',
                'version_number',
                'is_current',
            ]);
        });
    }
};
