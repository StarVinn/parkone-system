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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('vehicle_id');
            $table->unsignedBigInteger('parking_location_id');
            $table->unsignedBigInteger('parking_area_id');
            $table->unsignedBigInteger('parking_rate_id');
            $table->datetime('entry_time');
            $table->datetime('exit_time')->nullable();
            $table->decimal('total_hours', 8, 2)->nullable();
            $table->decimal('total_fee', 8, 2)->nullable();
            $table->enum('payment_status', ['paid', 'unpaid'])->default('unpaid');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('vehicle_id')->references('id')->on('vehicles')->onDelete('cascade');
            $table->foreign('parking_location_id')->references('id')->on('parking_locations')->onDelete('cascade');
            $table->foreign('parking_area_id')->references('id')->on('parking_areas')->onDelete('cascade');
            $table->foreign('parking_rate_id')->references('id')->on('parking_rates')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
