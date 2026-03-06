<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Services\PasswordService;
use Illuminate\Support\Facades\Password;

class PasswordController extends Controller
{
    public function __construct(
        protected PasswordService $passwordService
    ) {}

    public function sendResetLink(ForgotPasswordRequest $request)
    {
        $status = $this->passwordService
            ->sendResetLink($request->email);

        return $status === Password::RESET_LINK_SENT
            ? back()->with('success', __($status))
            : back()->withErrors(['email' => __($status)]);
    }

    public function reset(ResetPasswordRequest $request)
    {
        $status = $this->passwordService
            ->resetPassword($request->validated());

        return $status === Password::PASSWORD_RESET
            ? redirect()->route('login')
                ->with('success', 'Password berhasil direset.')
            : back()->withErrors(['email' => [__($status)]]);
    }

    public function setInitialPassword(ResetPasswordRequest $request)
    {
        $status = $this->passwordService
            ->setInitialPassword($request->validated());

        return $status === Password::PASSWORD_RESET
            ? redirect()->route('login')
                ->with('success', 'Password awal berhasil diset. Silakan login.')
            : back()->withErrors(['email' => [__($status)]]);
    }
}
