<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class TransactionResource extends JsonApiResource
{
    protected bool $includesPreviouslyLoadedRelationships = true;

    public $attributes = [
        'user_id',
        'vehicle_id',
        'parking_area_id',
        'parking_rate_id',
        'rfid_card_id',
        'rfid_uid',
        'entry_time',
        'exit_time',
        'total_hours',
        'total_fee',
        'status',
        'entry_vehicle_photo_url',
        'created_at',
        'updated_at',
    ];

    public $relationships = [
        'user',
        'vehicle',
        'parkingArea',
        'parkingRate',
        'rfidCard',
    ];
}