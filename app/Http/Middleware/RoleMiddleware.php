<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Cek apakah user sudah login
        if (!Auth::check()) {
            return redirect('/login');
        }

        // Get the role from middleware parameter
        $user = Auth::user();
        $roles = $this->getRolesFromMiddleware($request);
        
        if (empty($roles)) {
            abort(403, 'Konfigurasi role middleware tidak valid.');
        }
        
        if (!in_array($user->role, $roles)) {
            abort(403, 'Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman ini.');
        }
        

        return $next($request);
    }
    
    /**
     * Extract roles from route middleware
     */
    private function getRolesFromMiddleware(Request $request): array
    {
        $middlewares = $request->route()->action['middleware'] ?? [];
        
        foreach ((array) $middlewares as $middleware) {
            if (is_string($middleware) && Str::startsWith($middleware, 'role:')) {
                return explode('|', Str::after($middleware, 'role:'));
            }
        }
        
        return [];
    }
}
