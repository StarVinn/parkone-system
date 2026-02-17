<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParkingRate extends Model
{
    protected $fillable = [
        'location_id',
        'vehicle_type_id',
        'rate_per_hour',
    ];

    public function location()
    {
        return $this->belongsTo(ParkingLocation::class, 'location_id');
    }

    public function vehicleType()
    {
        return $this->belongsTo(VehicleType::class, 'vehicle_type_id');
    }
}
