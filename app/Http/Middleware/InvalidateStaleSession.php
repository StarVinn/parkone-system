<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class InvalidateStaleSession
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();
        $validRole = in_array((string) ($user->role ?? ''), ['admin', 'officer', 'owner'], true);
        $validSessionUser = $user && $user->id && (bool) ($user->is_active ?? false) && $validRole;

        if ($validSessionUser) {
            return $next($request);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Sesi login sudah tidak valid. Silakan login ulang.',
            ], 401);
        }

        return redirect()->route('login')
            ->with('error', 'Sesi login sudah tidak valid. Silakan login ulang.');
    }
}
