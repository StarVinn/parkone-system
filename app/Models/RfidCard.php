<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RfidCard extends Model
{
    protected $fillable = [
        'user_id',
        'vehicle_id',
        'uid',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
