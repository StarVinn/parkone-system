<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TransactionExitEvent extends Model
{
    protected $fillable = [
        'event_uuid',
        'event_type',
        'sequence_scope_type',
        'sequence_scope_key',
        'sequence_number',
        'occurred_at',
        'received_at',
        'parking_session_id',
        'transaction_id',
        'officer_id',
        'license_plate',
        'rfid_card_id',
        'payload',
        'status',
        'processed_at',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'occurred_at' => 'datetime',
            'received_at' => 'datetime',
            'processed_at' => 'datetime',
            'sequence_number' => 'integer',
        ];
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function officer()
    {
        return $this->belongsTo(User::class, 'officer_id');
    }

    public function rfidCard()
    {
        return $this->belongsTo(RfidCard::class);
    }
}
