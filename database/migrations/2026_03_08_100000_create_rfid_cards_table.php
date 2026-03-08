<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rfid_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('uid')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Backfill RFID lama dari users.rfid_uid agar data existing tetap bisa dipakai.
        $users = DB::table('users')
            ->select('id', 'rfid_uid')
            ->whereNotNull('rfid_uid')
            ->whereRaw("TRIM(rfid_uid) <> ''")
            ->get();

        foreach ($users as $user) {
            DB::table('rfid_cards')->updateOrInsert(
                ['uid' => trim((string) $user->rfid_uid)],
                [
                    'user_id' => $user->id,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('rfid_cards');
    }
};
