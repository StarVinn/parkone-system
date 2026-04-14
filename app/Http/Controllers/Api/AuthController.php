<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\PostLoginRequest;
use App\Http\Requests\PostRegisterRequest;
use App\Services\AuthService;
use App\Services\PasswordService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    private function formatUser($user): array
    {
        $user->loadMissing(['rfidCards', 'primaryRfidCard']);

        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'profile_photo' => $user->profile_photo,
            'profile_photo_url' => $user->profile_photo_url,
            'rfid_uid' => $user->rfid_uid,
            'is_active' => (bool) $user->is_active,
            'status' => $user->status,
        ];
    }

    private function isMobile(Request $request): bool
    {
        $ua = strtolower($request->userAgent() ?? '');
        return preg_match('/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i', $ua) || $request->header('X-Mobile-Emulator');
    }

    public function login(PostLoginRequest $request, AuthService $authService)
    {
        if (!$this->isMobile($request)) {
            return response()->json([
                'message' => 'API hanya dapat diakses melalui perangkat mobile.',
            ], 403);
        }

        try {
            $credentials = $request->safe()->only(['email', 'password']);
            $user = $authService->loginApi($credentials, 'api', ['user']);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Login gagal.',
                'errors' => $e->errors(),
            ], 422);
        }

        $tokenName = (string) ($request->input('device_name') ?: ($request->userAgent() ?: 'api'));
        $token = $user->createToken($tokenName)->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'token_type' => 'Bearer',
            'token' => $token,
            'user' => $this->formatUser($user),
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $token = $request->user()->currentAccessToken();
        if ($token instanceof PersonalAccessToken) {
            $request->user()->tokens()->whereKey($token->id)->delete();
        }

        return response()->json([
            'message' => 'Logout berhasil.',
        ]);
    }

    public function register(PostRegisterRequest $request, AuthService $authService)
    {
        $user = $authService->register($request->validated());

        $tokenName = (string) ($request->input('device_name') ?: ($request->userAgent() ?: 'api'));
        $token = $user->createToken($tokenName)->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil.',
            'token_type' => 'Bearer',
            'token' => $token,
            'user' => $this->formatUser($user),
        ], 201);
    }

    public function forgotPassword(ForgotPasswordRequest $request, PasswordService $passwordService)
    {
        if (!$this->isMobile($request)) {
            return response()->json([
                'message' => 'API hanya dapat diakses melalui perangkat mobile.',
            ], 403);
        }

        $status = $passwordService->sendResetLink($request->email);

        if ($status !== Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => __($status),
            ], 422);
        }

        return response()->json([
            'message' => 'Link reset password berhasil dikirim ke email Anda.',
        ]);
    }
}