<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\PostLoginRequest;
use App\Http\Requests\StoreUserRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        abort_if(Auth::check(), 403, 'Anda sudah login.');
        return view('auth.login');
    }

    public function showRegisterForm()
    {
        abort_if(Auth::check(), 403, 'Anda sudah login.');
        return view('auth.register');
    }

    public function login(PostLoginRequest $request)
    {
        $credentials = $request->only('email', 'password');

        // Check if user exists before attempting login  
        if (!$user = \App\Models\User::where('email', $credentials['email'])->first()) {
            return back()->withErrors([
                'email' => 'Akun tidak ditemukan.',
            ])->withInput();
        }

        // Check credentials and login
        if (!Auth::attempt($credentials)) {
            return back()->withErrors([
                'email' => 'Email atau password salah.',
            ])->withInput();
        
        }
        
        $user = Auth::user();

        // Check if user is active
        if (!$user->is_active) {
            Auth::logout();
            return back()->withErrors([
                'email' => 'Akun Anda tidak aktif. Silakan hubungi administrator.',
            ])->withInput();
        }

        // Check if user has user role (non-admin/officer/owner)
        if (!in_array($user->role, ['admin', 'officer', 'owner'])) {
            Auth::logout();
            return back()->withErrors([
                'email' => 'Akun Anda tidak memiliki akses ke sistem.',
            ])->withInput();
        }

        // Generate new session ID to prevent session fixation
        $request->session()->regenerate();

        // Redirect based on role
        return match ($user->role) {
            'admin'   => redirect()->intended('/admin'),
            'officer' => redirect()->intended('/officer'),
            'owner'   => redirect()->intended('/owner'),
        };
    }

    public function register(StoreUserRequest $request)
    {
        $validatedData = $request->validated([
            'name',
            'email',
            'password',
            'role',
            'is_active',
        ]);
        $user = new \App\Models\User();
        $user->name = $validatedData['name'];
        $user->email = $validatedData['email'];
        $user->password = bcrypt($validatedData['password']);
        $user->role = 'user';
        $user->is_active = $validatedData['is_active'];
        $user->save();

        return redirect('/login')->with('success', 'Registrasi berhasil. Silakan login.');
    }

    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
