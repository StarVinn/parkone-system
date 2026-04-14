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

    public function getMapsUrlAttribute(): ?string
    {
        $latitude = is_numeric($this->latitude) ? (float) $this->latitude : null;
        $longitude = is_numeric($this->longitude) ? (float) $this->longitude : null;

        if ($latitude === null || $longitude === null) {
            return null;
        }

        return 'https://www.google.com/maps?q=' . urlencode($latitude . ',' . $longitude);
    }

    public function getStreetViewUrlAttribute(): ?string
    {
        $apiKey = config('services.google.maps_api_key');
        $streetViewEnabled = (bool) config('services.google.street_view_enabled', false);
        $latitude = is_numeric($this->latitude) ? (float) $this->latitude : null;
        $longitude = is_numeric($this->longitude) ? (float) $this->longitude : null;

        if (! $streetViewEnabled || $latitude === null || $longitude === null || ! $apiKey) {
            return null;
        }

        return 'https://maps.googleapis.com/maps/api/streetview?size=1200x800&fov=80&pitch=0&source=outdoor&location=' . rawurlencode($latitude . ',' . $longitude) . '&key=' . rawurlencode($apiKey);
    }
}
