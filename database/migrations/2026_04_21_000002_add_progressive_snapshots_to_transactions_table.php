<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->decimal('first_hour_rate_snapshot', 12, 2)
                ->nullable()
                ->after('rate_per_hour_snapshot');
            $table->decimal('next_hour_rate_snapshot', 12, 2)
                ->nullable()
                ->after('first_hour_rate_snapshot');
            $table->unsignedSmallInteger('grace_minutes_snapshot')
                ->nullable()
                ->after('next_hour_rate_snapshot');
        });

        DB::statement(<<<'SQL'
            UPDATE transactions t
            INNER JOIN parking_rates pr ON pr.id = t.parking_rate_id
            SET
                t.first_hour_rate_snapshot = COALESCE(pr.first_hour_rate, pr.rate_per_hour),
                t.next_hour_rate_snapshot = COALESCE(pr.next_hour_rate, pr.rate_per_hour),
                t.grace_minutes_snapshot = COALESCE(pr.grace_minutes, 0)
            WHERE t.parking_rate_id IS NOT NULL
        SQL);
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn([
                'first_hour_rate_snapshot',
                'next_hour_rate_snapshot',
                'grace_minutes_snapshot',
            ]);
        });
    }
};
