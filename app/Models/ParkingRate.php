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
        'pricing_rule_key',
        'version_number',
        'is_current',
        'rate_type',
        'rate_per_hour',
        'first_hour_rate',
        'next_hour_rate',
        'grace_minutes',
        'flat_rate',
    ];

    protected $casts = [
        'rate_per_hour' => 'float',
        'first_hour_rate' => 'float',
        'next_hour_rate' => 'float',
        'grace_minutes' => 'integer',
        'flat_rate' => 'float',
        'version_number' => 'integer',
        'is_current' => 'boolean',
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
