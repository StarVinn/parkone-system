<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PostLoginRequest;
use App\Http\Requests\PostRegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function isMobile(Request $request): bool
    {
        $ua = strtolower($request->userAgent() ?? '');
        return preg_match('/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i', $ua) || $request->header('X-Mobile-Emulator');
    }

    public function login(PostLoginRequest $request, AuthService $authService)
    {
        if (!$this->isMobile($request)) {
            return response()->json([
                'message' => 'API access only for mobile applications.',
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
            'user' => $user,
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

        $request->user()->currentAccessToken()?->delete();

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
            'user' => $user,
        ], 201);
    }
}
