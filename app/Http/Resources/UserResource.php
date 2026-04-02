<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\JsonApi\JsonApiResource;

class UserResource extends JsonApiResource
{
    protected bool $includesPreviouslyLoadedRelationships = true;

    public $attributes = [
        'name',
        'email',
        'role',
        'profile_photo',
        'rfid_uid',
        'is_active',
        'status',
        'created_at',
        'updated_at',
    ];

    public $relationships = [
        'rfidCards',
        'primaryRfidCard',
    ];
}