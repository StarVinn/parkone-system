<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParkingArea extends Model
{
    protected $fillable = [
        'name',
        'parking_location_id',
        'capacity',
        'occupied',
    ];

    public function location()
    {
        return $this->belongsTo(ParkingLocation::class, 'parking_location_id');
    }
}
