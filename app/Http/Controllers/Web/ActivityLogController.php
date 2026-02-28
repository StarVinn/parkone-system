<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivityLogController extends Controller
{
    public function index(Request $request, ActivityLogService $activityLogService)
    {
        abort_if(Auth::user()->role !== 'admin', 403, 'Akses ditolak.');

        $filters = [
            'search' => $request->string('search')->toString(),
            'user_id' => $request->string('user_id')->toString(),
            'date_from' => $request->string('date_from')->toString(),
            'date_to' => $request->string('date_to')->toString(),
        ];

        return inertia('Admin/ActivityLog/Index', [
            'activityLogs' => $activityLogService->getAllForAdmin($filters),
            'filters' => $filters,
            'users' => User::select('id', 'name', 'email')->orderBy('name')->get(),
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
