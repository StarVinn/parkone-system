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
            $table->string('rate_type_snapshot', 20)
                ->nullable()
                ->after('rfid_card_id');
            $table->decimal('rate_per_hour_snapshot', 12, 2)
                ->nullable()
                ->after('rate_type_snapshot');
            $table->decimal('flat_rate_snapshot', 12, 2)
                ->nullable()
                ->after('rate_per_hour_snapshot');
        });

        DB::statement(<<<'SQL'
            UPDATE transactions t
            INNER JOIN parking_rates pr ON pr.id = t.parking_rate_id
            SET
                t.rate_type_snapshot = pr.rate_type,
                t.rate_per_hour_snapshot = pr.rate_per_hour,
                t.flat_rate_snapshot = pr.flat_rate
            WHERE t.parking_rate_id IS NOT NULL
        SQL);

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['rfid_uid', 'status']);
            $table->dropColumn('rfid_uid');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('rfid_uid')->nullable()->after('parking_rate_id');
            $table->index(['rfid_uid', 'status']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn([
                'rate_type_snapshot',
                'rate_per_hour_snapshot',
                'flat_rate_snapshot',
            ]);
        });
    }
};
