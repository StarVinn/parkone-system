<?php

use App\Http\Controllers\Web\PasswordController;
use App\Http\Controllers\Web\VehicleTypeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;



Route::get('/', function () {
    return view('welcome');
});

/*
|--------------------------------------------------------------------------
| AUTHENTICATION
|--------------------------------------------------------------------------
*/

Route::get('/login', [App\Http\Controllers\Web\AuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [App\Http\Controllers\Web\AuthController::class, 'login']);
Route::post('/logout', [App\Http\Controllers\Web\AuthController::class, 'logout'])->name('logout');
Route::get('/register', [App\Http\Controllers\Web\AuthController::class, 'showRegisterForm'])->name('register');
Route::post('/register', [App\Http\Controllers\Web\AuthController::class, 'register'])->name('register.store');
Route::get('/forgot-password', function () { return Inertia::render('Auth/ForgotPassword'); })->name('password.request');
Route::post('/forgot-password', [PasswordController::class, 'sendResetLink'])->name('password.email');
Route::get('/reset-password/{token}', function ($token) {
    return Inertia::render('Auth/ResetPassword', [
        'token' => $token,
        'email' => request('email'),
    ]);
})->name('password.reset');
Route::post('/reset-password', [PasswordController::class, 'reset'])->name('password.update');
/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::prefix('admin')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Admin/Dashboard');
        });
        Route::prefix('vehicle-types')->group(function () {
            Route::get('/', [VehicleTypeController::class, 'index'])->name('admin.vehicle-types.index');
            Route::get('/create', [VehicleTypeController::class, 'showCreate'])->name('admin.vehicle-types.create');
            Route::post('/', [VehicleTypeController::class, 'store'])->name('admin.vehicle-types.store');
            Route::get('/{id}/edit', [VehicleTypeController::class, 'showEdit'])->name('admin.vehicle-types.edit');
            Route::put('/{id}', [VehicleTypeController::class, 'update'])->name('admin.vehicle-types.update');
            Route::delete('/{id}', [VehicleTypeController::class, 'destroy'])->name('admin.vehicle-types.destroy');
        });

        Route::prefix('parking-locations')->group(function () {
            Route::get('/', [\App\Http\Controllers\Web\ParkingLocationController::class, 'index'])->name('admin.parking-locations.index');
            Route::get('/create', [\App\Http\Controllers\Web\ParkingLocationController::class, 'showCreate'])->name('admin.parking-locations.create');
            Route::post('/', [\App\Http\Controllers\Web\ParkingLocationController::class, 'store'])->name('admin.parking-locations.store');
            Route::get('/{id}/edit', [\App\Http\Controllers\Web\ParkingLocationController::class, 'showEdit'])->name('admin.parking-locations.edit');
            Route::put('/{id}', [\App\Http\Controllers\Web\ParkingLocationController::class, 'update'])->name('admin.parking-locations.update');
            Route::delete('/{id}', [\App\Http\Controllers\Web\ParkingLocationController::class, 'destroy'])->name('admin.parking-locations.destroy');
        });
        
    });
});

/*
|--------------------------------------------------------------------------
| OFFICER
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:officer'])->group(function () {
    Route::prefix('officer')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Officer/Dashboard');
        });
    });
});

/*
|--------------------------------------------------------------------------
| OWNER
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:owner'])->group(function () {
    Route::prefix('owner')->group(function () {
        Route::get('/', function () {
            return Inertia::render('Owner/Dashboard');
        });
    });
});