<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('parking_areas', function (Blueprint $table) {
            $table->unsignedBigInteger('ticket_penalty')
                ->default(10000)
                ->after('occupied');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parking_areas', function (Blueprint $table) {
            $table->dropColumn('ticket_penalty');
        });
    }
};
