<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function login(array $credentials, string $source = 'web')
    {
        $user = User::where('email', $credentials['email'])->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'email' => 'Akun tidak ditemukan.',
            ]);
        }

        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => 'Email atau password salah.',
            ]);
        }

        $user = Auth::user();

        if (!$user->is_active) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => 'Akun Anda tidak aktif. Silakan hubungi administrator.',
            ]);
        }

        if (!in_array($user->role, ['admin', 'officer', 'owner'])) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => 'Akun Anda tidak memiliki akses ke sistem.',
            ]);
        }

        $normalizedSource = strtolower($source);
        if (!in_array($normalizedSource, ['web', 'mobile'])) {
            $normalizedSource = 'web';
        }

        ActivityLog::create([
            'user_id' => $user->id,
            'activity' => 'User login (' . $normalizedSource . ')',
            'activity_time' => now(),
        ]);

        return $user;
    }

    public function register(array $data)
    {
        return User::create([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'password'  => bcrypt($data['password']),
            'role'      => 'user',
            'is_active' => true,
            'status'    => 'active',
        ]);
    }

    public function logout()
    {
        Auth::logout();
    }
}
