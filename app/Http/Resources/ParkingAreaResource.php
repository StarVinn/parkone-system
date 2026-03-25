<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class ParkingAreaResource extends JsonApiResource
{
    protected bool $includesPreviouslyLoadedRelationships = true;

    public $attributes = [
        'name',
        'parking_location_id',
        'capacity',
        'occupied',
        'ticket_penalty',
        'created_at',
        'updated_at',
    ];

    public $relationships = [
        'location',
    ];
}