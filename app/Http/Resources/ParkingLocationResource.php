<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class ParkingLocationResource extends JsonApiResource
{
    protected bool $includesPreviouslyLoadedRelationships = true;

    public $attributes = [
        'name',
        'latitude',
        'longitude',
        'description',
        'created_at',
        'updated_at',
    ];

    public $relationships = [
        'areas',
    ];
}