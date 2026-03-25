<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class VehicleResource extends JsonApiResource
{
    protected bool $includesPreviouslyLoadedRelationships = true;

    public $attributes = [
        'license_plate',
        'vehicle_type_id',
        'created_at',
        'updated_at',
    ];

    public $relationships = [
        'vehicleType',
    ];
}