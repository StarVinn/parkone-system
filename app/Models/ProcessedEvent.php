<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProcessedEvent extends Model
{
    protected $fillable = [
        'event_uuid',
        'consumer_name',
        'sequence_scope_type',
        'sequence_scope_key',
        'sequence_number',
        'parking_session_id',
        'status',
        'anomaly_type',
        'message',
        'processed_at',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'processed_at' => 'datetime',
            'sequence_number' => 'integer',
        ];
    }
}