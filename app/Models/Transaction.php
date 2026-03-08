<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Transaction extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'vehicle_id',
        'parking_area_id',
        'parking_rate_id',
        'rfid_card_id',
        'rfid_uid',
        'entry_time',
        'entry_vehicle_photo_path',
        'exit_time',
        'total_hours',
        'total_fee',
        'status',
    ];

    protected $appends = [
        'entry_vehicle_photo_url',
    ];

    protected function casts(): array
    {
        return [
            'entry_time' => 'datetime',
            'exit_time' => 'datetime',
            'total_hours' => 'float',
            'total_fee' => 'float',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function parkingArea()
    {
        return $this->belongsTo(ParkingArea::class, 'parking_area_id');
    }

    public function parkingRate()
    {
        return $this->belongsTo(ParkingRate::class, 'parking_rate_id');
    }

    public function rfidCard()
    {
        return $this->belongsTo(RfidCard::class, 'rfid_card_id');
    }

    public function getEntryVehiclePhotoUrlAttribute(): ?string
    {
        if (!$this->entry_vehicle_photo_path) {
            return null;
        }

        return Storage::disk('public')->url($this->entry_vehicle_photo_path);
    }
}
