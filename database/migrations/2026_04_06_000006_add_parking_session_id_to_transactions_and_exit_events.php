<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('parking_session_id')->nullable()->after('rfid_card_id');
        });

        Schema::table('transaction_exit_events', function (Blueprint $table) {
            $table->string('parking_session_id')->nullable()->after('received_at');
        });
    }

    public function down(): void
    {
        Schema::table('transaction_exit_events', function (Blueprint $table) {
            $table->dropColumn('parking_session_id');
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('parking_session_id');
        });
    }
};
