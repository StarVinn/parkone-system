<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $webLogins = ActivityLog::query()
            ->where('activity', 'like', 'User login%')
            ->where(function ($query) {
                $query->where('activity', 'User login')
                    ->orWhere('activity', 'like', '%(web)%');
            })
            ->count();

        $mobileLogins = ActivityLog::query()
            ->where('activity', 'like', 'User login%')
            ->where('activity', 'like', '%(mobile)%')
            ->count();

        return inertia('Admin/Dashboard', [
            'loginChart' => [
                'web' => $webLogins,
                'mobile' => $mobileLogins,
                'total' => $webLogins + $mobileLogins,
            ],
        ]);
    }
}
