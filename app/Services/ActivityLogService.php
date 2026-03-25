<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Carbon;

class ActivityLogService
{
    public function getAllForAdmin(array $filters = [], int $perPage = 15)
    {
        $search = trim((string) ($filters['search'] ?? ''));
        $userId = (string) ($filters['user_id'] ?? '');
        $dateFrom = trim((string) ($filters['date_from'] ?? ''));
        $dateTo = trim((string) ($filters['date_to'] ?? ''));

        $from = null;
        $to = null;

        try {
            $from = $dateFrom !== '' ? Carbon::parse($dateFrom)->startOfDay() : null;
        } catch (\Throwable) {
            $from = null;
        }

        try {
            $to = $dateTo !== '' ? Carbon::parse($dateTo)->endOfDay() : null;
        } catch (\Throwable) {
            $to = null;
        }

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
            ->when($from, fn($query, $value) => $query->where('activity_time', '>=', $value))
            ->when($to, fn($query, $value) => $query->where('activity_time', '<=', $value))
            ->latest('activity_time')
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function deleteActivityLog(ActivityLog $activityLog): void
    {
        $activityLog->delete();
    }
}
