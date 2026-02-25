<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'vehicle_id',
        'parking_area_id',
        'entry_time',
        'exit_time',
        'status',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function parkingArea()
    {
        return $this->belongsTo(ParkingArea::class, 'parking_area_id');
    }
}
