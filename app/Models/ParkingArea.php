<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParkingArea extends Model
{
    protected $fillable = [
        'name',
        'location_id',
        'capacity',
        'description',
    ];

    public function location()
    {
        return $this->belongsTo(ParkingLocation::class, 'location_id');
    }
}
