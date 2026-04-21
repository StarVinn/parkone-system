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
        'parking_session_id',
        'parking_rate_rule_key_snapshot',
        'parking_rate_version_number_snapshot',
        'rate_type_snapshot',
        'rate_per_hour_snapshot',
        'first_hour_rate_snapshot',
        'next_hour_rate_snapshot',
        'grace_minutes_snapshot',
        'flat_rate_snapshot',
        'exit_sync_status',
        'exit_synced_at',
        'exit_sync_error',
        'entry_time',
        'entry_vehicle_photo_path',
        'exit_time',
        'total_hours',
        'total_fee',
        'status',
    ];

    protected $appends = [
        'entry_vehicle_photo_url',
        'rfid_uid',
    ];

    protected function casts(): array
    {
        return [
            'entry_time' => 'datetime',
            'exit_time' => 'datetime',
            'parking_session_id' => 'string',
            'parking_rate_version_number_snapshot' => 'integer',
            'rate_per_hour_snapshot' => 'float',
            'first_hour_rate_snapshot' => 'float',
            'next_hour_rate_snapshot' => 'float',
            'grace_minutes_snapshot' => 'integer',
            'flat_rate_snapshot' => 'float',
            'exit_synced_at' => 'datetime',
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
        return $this->belongsTo(ParkingRate::class, 'parking_rate_id')->withTrashed();
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

        return asset('storage/' . ltrim($this->entry_vehicle_photo_path, '/'));
    }

    public function getRfidUidAttribute(): ?string
    {
        if ($this->relationLoaded('rfidCard') && $this->rfidCard) {
            return $this->rfidCard->uid;
        }

        if ($this->rfid_card_id) {
            $card = $this->rfidCard()->select('id', 'uid')->first();

            return $card?->uid;
        }

        return null;
    }
}
