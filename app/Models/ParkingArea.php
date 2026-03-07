<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ParkingArea extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'parking_location_id',
        'capacity',
        'occupied',
        'ticket_penalty',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'occupied' => 'integer',
            'ticket_penalty' => 'integer',
        ];
    }

    public function location()
    {
        return $this->belongsTo(ParkingLocation::class, 'parking_location_id');
    }
}
