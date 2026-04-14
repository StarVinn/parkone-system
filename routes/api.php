<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MobileController;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
});

Route::get('/user', function (Request $request) {
    return new UserResource($request->user());
})->middleware('auth:sanctum');

Route::get('/dashboard', DashboardController::class)->middleware('auth:sanctum');

Route::prefix('mobile')->middleware(['auth:sanctum', 'role:user'])->group(function () {
    Route::get('/dashboard', [MobileController::class, 'dashboard']);
    Route::get('/vehicle-types', [MobileController::class, 'vehicleTypes']);
    Route::get('/transactions', [MobileController::class, 'transactions']);
    Route::get('/transactions/{id}', [MobileController::class, 'transactionDetail']);
    Route::get('/parking-locations', [MobileController::class, 'locations']);
    Route::get('/parking-locations/{parkingLocation}', [MobileController::class, 'location']);

    Route::get('/profile', [MobileController::class, 'profile']);
    Route::patch('/profile', [MobileController::class, 'updateProfile']);
    Route::post('/profile/password', [MobileController::class, 'changePassword']);
    Route::post('/profile/rfid', [MobileController::class, 'bindRfid']);
});
