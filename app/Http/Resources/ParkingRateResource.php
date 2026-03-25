<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class ParkingRateResource extends JsonApiResource
{
    protected bool $includesPreviouslyLoadedRelationships = true;

    public $attributes = [
        'location_id',
        'vehicle_type_id',
        'rate_type',
        'rate_per_hour',
        'flat_rate',
        'created_at',
        'updated_at',
    ];

    public $relationships = [
        'location',
        'vehicleType',
    ];
}