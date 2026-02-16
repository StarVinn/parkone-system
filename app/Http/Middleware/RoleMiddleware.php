<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
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
        // Get the authenticated user
        $user = $request->user();

        // Check if the user is authenticated and has the 'admin' role
        if (!$user ){
            abort(401, 'Unauthorized');
        }

        if ($user->role !== 'admin') {
            abort(403, 'Forbidden');
        }
        
        if (!$user->is_active) {
            abort(403, 'Your account is inactive. Please contact the administrator.');
        }

        return $next($request);
    }
}
