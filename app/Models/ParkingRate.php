<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ParkingRate extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'location_id',
        'vehicle_type_id',
        'rate_type',
        'rate_per_hour',
        'flat_rate',
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
