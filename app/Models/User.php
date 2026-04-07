<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasApiTokens, Notifiable;
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'profile_photo',
        'is_active',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function sendPasswordResetNotification($token)
    {
        $this->notify(
            new \App\Notifications\CustomResetPassword($token)
        );
    }

    public function rfidCards()
    {
        return $this->hasMany(RfidCard::class);
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class, 'user_id');
    }

    public function primaryRfidCard()
    {
        return $this->hasOne(RfidCard::class)
            ->where('is_active', true)
            ->latest('id');
    }

    public function getRfidUidAttribute(): ?string
    {
        if ($this->relationLoaded('primaryRfidCard') && $this->primaryRfidCard) {
            return $this->primaryRfidCard->uid;
        }

        if ($this->relationLoaded('rfidCards') && $this->rfidCards->isNotEmpty()) {
            return $this->rfidCards->firstWhere('is_active', true)?->uid
                ?? $this->rfidCards->first()?->uid;
        }

        $card = $this->primaryRfidCard()->select('id', 'uid')->first();

        return $card?->uid;
    }
}
