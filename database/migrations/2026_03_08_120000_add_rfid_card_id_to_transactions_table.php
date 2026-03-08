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
            $table->foreignId('rfid_card_id')
                ->nullable()
                ->after('parking_rate_id')
                ->constrained('rfid_cards')
                ->nullOnDelete();
            $table->index(['rfid_card_id', 'status']);
        });

        // Backfill dari rfid_uid lama jika ada data historis.
        DB::statement("
            UPDATE transactions t
            INNER JOIN rfid_cards rc ON UPPER(rc.uid) = UPPER(t.rfid_uid)
            SET t.rfid_card_id = rc.id
            WHERE t.rfid_uid IS NOT NULL
              AND t.rfid_uid <> ''
              AND t.rfid_card_id IS NULL
        ");
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['rfid_card_id', 'status']);
            $table->dropConstrainedForeignId('rfid_card_id');
        });
    }
};
