<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'rfid_uid')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('rfid_uid');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('rfid_uid')->nullable()->after('profile_photo');
        });
    }
};
