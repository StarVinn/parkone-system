<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('rfid_uid')->nullable()->after('parking_rate_id');
            $table->index(['rfid_uid', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['rfid_uid', 'status']);
            $table->dropColumn('rfid_uid');
        });
    }
};
