<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaction_exit_events', function (Blueprint $table) {
            $table->string('sequence_scope_type')->nullable()->after('event_type');
            $table->string('sequence_scope_key')->nullable()->after('sequence_scope_type');
            $table->timestamp('received_at')->nullable()->after('occurred_at');
            $table->unique(['sequence_scope_type', 'sequence_scope_key', 'sequence_number'], 'transaction_exit_events_scope_sequence_unique');
        });

        Schema::create('event_sequences', function (Blueprint $table) {
            $table->id();
            $table->string('scope_type');
            $table->string('scope_key');
            $table->unsignedBigInteger('current_sequence')->default(0);
            $table->timestamps();
            $table->unique(['scope_type', 'scope_key']);
        });

        Schema::create('processed_events', function (Blueprint $table) {
            $table->id();
            $table->string('event_uuid');
            $table->string('consumer_name');
            $table->string('sequence_scope_type')->nullable();
            $table->string('sequence_scope_key')->nullable();
            $table->unsignedBigInteger('sequence_number')->nullable();
            $table->string('parking_session_id')->nullable();
            $table->enum('status', ['success', 'failed', 'skipped']);
            $table->string('anomaly_type')->nullable();
            $table->text('message')->nullable();
            $table->timestamp('processed_at');
            $table->json('payload')->nullable();
            $table->timestamps();
            $table->unique(['event_uuid', 'consumer_name']);
            $table->index(['consumer_name', 'sequence_scope_type', 'sequence_scope_key', 'sequence_number'], 'processed_events_scope_sequence_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processed_events');
        Schema::dropIfExists('event_sequences');

        Schema::table('transaction_exit_events', function (Blueprint $table) {
            $table->dropUnique('transaction_exit_events_scope_sequence_unique');
            $table->dropColumn([
                'sequence_scope_type',
                'sequence_scope_key',
                'received_at',
            ]);
        });
    }
};
