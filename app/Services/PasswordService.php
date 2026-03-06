<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class PasswordService
{
    /**
     * Create a new class instance.
     */
    public function sendResetLink(string $email): string
    {
        return Password::sendResetLink([
            'email' => $email
        ]);
    }

    public function resetPassword(array $data): string
    {
        return Password::reset(
            $data,
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                event(new PasswordReset($user));

                ActivityLog::create([
                    'user_id' => $user->id,
                    'activity' => 'Reset password',
                    'activity_time' => now(),
                ]);
            }
        );
    }

    public function setInitialPassword(array $data): string
    {
        return Password::reset(
            $data,
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'is_active' => true,
                    'email_verified_at' => now(),
                ])->save();

                event(new PasswordReset($user));

                ActivityLog::create([
                    'user_id' => $user->id,
                    'activity' => 'Set initial password',
                    'activity_time' => now(),
                ]);
            }
        );
    }
}
