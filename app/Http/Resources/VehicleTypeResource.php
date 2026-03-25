<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class VehicleTypeResource extends JsonApiResource
{
    public $attributes = [
        'name',
        'description',
        'created_at',
        'updated_at',
    ];
}