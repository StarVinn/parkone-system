<?php

namespace App\Services;

use App\Models\ActivityLog;

class ActivityLogService
{
    public function getAllForAdmin()
    {
        return ActivityLog::with('user:id,name,email')
            ->latest('activity_time')
            ->latest()
            ->get();
    }

    public function deleteActivityLog(ActivityLog $activityLog): void
    {
        $activityLog->delete();
    }
}
