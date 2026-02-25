<?php

use App\Http\Controllers\Web\ParkingAreaController;
use App\Http\Controllers\Web\ParkingLocationController;
use App\Http\Controllers\Web\PasswordController;
use App\Http\Controllers\Web\VehicleRateController;
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
            Route::get('/', [ParkingLocationController::class, 'index'])->name('admin.parking-locations.index');
            Route::get('/create', [ParkingLocationController::class, 'showCreate'])->name('admin.parking-locations.create');
            Route::post('/', [ParkingLocationController::class, 'store'])->name('admin.parking-locations.store');
            Route::get('/{id}/edit', [ParkingLocationController::class, 'showEdit'])->name('admin.parking-locations.edit');
            Route::put('/{id}', [ParkingLocationController::class, 'update'])->name('admin.parking-locations.update');
            Route::delete('/{id}', [ParkingLocationController::class, 'destroy'])->name('admin.parking-locations.destroy');
        });

        Route::prefix('parking-areas')->group(function () {
            Route::get('/', [ParkingAreaController::class, 'index'])->name('admin.parking-areas.index');
            Route::get('/create', [ParkingAreaController::class, 'showCreate'])->name('admin.parking-areas.create');
            Route::post('/', [ParkingAreaController::class, 'store'])->name('admin.parking-areas.store');
            Route::get('/{id}/edit', [ParkingAreaController::class, 'showEdit'])->name('admin.parking-areas.edit');
            Route::put('/{id}', [ParkingAreaController::class, 'update'])->name('admin.parking-areas.update');
            Route::delete('/{id}', [ParkingAreaController::class, 'destroy'])->name('admin.parking-areas.destroy');
        });

        Route::prefix('vehicle-rates')->group(function () {
            Route::get('/', [VehicleRateController::class, 'index'])->name('admin.vehicle-rates.index');
            Route::get('/create', [VehicleRateController::class, 'showCreate'])->name('admin.vehicle-rates.create');
            Route::post('/', [VehicleRateController::class, 'store'])->name('admin.vehicle-rates.store');
            Route::get('/{id}/edit', [VehicleRateController::class, 'showEdit'])->name('admin.vehicle-rates.edit');
            Route::put('/{id}', [VehicleRateController::class, 'update'])->name('admin.vehicle-rates.update');
            Route::delete('/{id}', [VehicleRateController::class, 'destroy'])->name('admin.vehicle-rates.destroy');
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