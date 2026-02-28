<?php

namespace App\Services;

use App\Models\ActivityLog;

class ActivityLogService
{
    public function getAllForAdmin(array $filters = [])
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $userId = (string) ($filters['user_id'] ?? '');

        return ActivityLog::with('user:id,name,email')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery->where('activity', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->when($userId, fn($query, $id) => $query->where('user_id', $id))
            ->latest('activity_time')
            ->latest()
            ->get();
    }

    public function deleteActivityLog(ActivityLog $activityLog): void
    {
        $activityLog->delete();
    }
}
