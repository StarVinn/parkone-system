<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\PostLoginRequest;
use App\Http\Requests\StoreUserRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function showLoginForm()
    {
        abort_if(Auth::check(), 403, 'Anda sudah login.');
        return Inertia::render('Auth/Login');
    }

    public function showRegisterForm()
    {
        abort_if(Auth::check(), 403, 'Anda sudah login.');
        return Inertia::render('Auth/Register');
    }

    public function login(PostLoginRequest $request)
    {
        $user = $this->authService->login(
            $request->only('email', 'password')
        );

        $request->session()->regenerate();

        return match ($user->role) {
            'admin'   => redirect()->intended('/admin'),
            'officer' => redirect()->intended('/officer'),
            'owner'   => redirect()->intended('/owner'),
        };
    }

    public function register(StoreUserRequest $request)
    {
        $this->authService->register(
            $request->validated()
        );

        return redirect('/login')
            ->with('success', 'Registrasi berhasil. Silakan login.');
    }

    public function logout(Request $request)
    {
        $this->authService->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}