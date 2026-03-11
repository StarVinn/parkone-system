<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ParkingLocation extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'latitude',
        'longitude',
        'description',
    ];

    public function areas()
    {
        return $this->hasMany(ParkingArea::class, 'parking_location_id');
    }

    public function rates()
    {
        return $this->hasMany(ParkingRate::class, 'location_id');
    }
}
