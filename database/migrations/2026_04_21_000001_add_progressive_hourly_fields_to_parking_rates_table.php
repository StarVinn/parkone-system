<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('parking_rates', function (Blueprint $table) {
            $table->decimal('first_hour_rate', 12, 2)->nullable()->after('rate_per_hour');
            $table->decimal('next_hour_rate', 12, 2)->nullable()->after('first_hour_rate');
            $table->unsignedSmallInteger('grace_minutes')->default(0)->after('next_hour_rate');
        });

        DB::statement("UPDATE parking_rates SET first_hour_rate = rate_per_hour WHERE first_hour_rate IS NULL AND rate_type = 'hourly'");
        DB::statement("UPDATE parking_rates SET next_hour_rate = rate_per_hour WHERE next_hour_rate IS NULL AND rate_type = 'hourly'");
    }

    public function down(): void
    {
        Schema::table('parking_rates', function (Blueprint $table) {
            $table->dropColumn([
                'first_hour_rate',
                'next_hour_rate',
                'grace_minutes',
            ]);
        });
    }
};
