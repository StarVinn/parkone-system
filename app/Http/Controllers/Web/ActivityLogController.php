<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Services\ActivityLogService;
use Illuminate\Support\Facades\Auth;

class ActivityLogController extends Controller
{
    public function index(ActivityLogService $activityLogService)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        return inertia('Admin/ActivityLog/Index', [
            'activityLogs' => $activityLogService->getAllForAdmin(),
        ]);
    }

    public function destroy($id, ActivityLogService $activityLogService)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        $activityLog = ActivityLog::findOrFail($id);
        $activityLogService->deleteActivityLog($activityLog);

        return redirect()
            ->route('admin.activity-logs.index')
            ->with('success', 'Activity log berhasil dihapus.');
    }
}
