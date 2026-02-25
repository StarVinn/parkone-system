<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ActivityLog extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'activity',
        'activity_time',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
