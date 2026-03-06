<?php

use App\Http\Controllers\Web\AdminDashboardController;
use App\Http\Controllers\Web\AdminCategoryController;
use App\Http\Controllers\Web\ParkingAreaController;
use App\Http\Controllers\Web\ParkingLocationController;
use App\Http\Controllers\Web\PasswordController;
use App\Http\Controllers\Web\ActivityLogController;
use App\Http\Controllers\Web\ParkingRateController;
use App\Http\Controllers\Web\VehicleTypeController;
use App\Http\Controllers\Web\VehicleController;
use App\Http\Controllers\Web\TransactionController;
use App\Http\Controllers\Web\AdminAccountController;
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
Route::get('/set-password/{token}', function ($token) {
    return Inertia::render('Auth/SetPassword', [
        'token' => $token,
        'email' => request('email'),
    ]);
})->name('password.set');
Route::post('/set-password', [PasswordController::class, 'setInitialPassword'])->name('password.set.store');
/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::prefix('admin')->group(function () {
        Route::get('/', [AdminDashboardController::class, 'index']);
        Route::get('/vehicle', [AdminCategoryController::class, 'vehicle'])->name('admin.category.vehicle');
        Route::get('/parking', [AdminCategoryController::class, 'parking'])->name('admin.category.parking');
        Route::prefix('vehicle-types')->group(function () {
            Route::get('/', [VehicleTypeController::class, 'index'])->name('admin.vehicle-types.index');
            Route::get('/create', [VehicleTypeController::class, 'showCreate'])->name('admin.vehicle-types.create');
            Route::post('/', [VehicleTypeController::class, 'store'])->name('admin.vehicle-types.store');
            Route::get('/{id}/edit', [VehicleTypeController::class, 'showEdit'])->name('admin.vehicle-types.edit');
            Route::put('/{id}', [VehicleTypeController::class, 'update'])->name('admin.vehicle-types.update');
            Route::delete('/{id}', [VehicleTypeController::class, 'destroy'])->name('admin.vehicle-types.destroy');
        });

        Route::prefix('vehicles')->group(function () {
            Route::get('/', [VehicleController::class, 'index'])->name('admin.vehicles.index');
            Route::get('/create', [VehicleController::class, 'showCreate'])->name('admin.vehicles.create');
            Route::post('/', [VehicleController::class, 'store'])->name('admin.vehicles.store');
            Route::get('/{id}/edit', [VehicleController::class, 'showEdit'])->name('admin.vehicles.edit');
            Route::put('/{id}', [VehicleController::class, 'update'])->name('admin.vehicles.update');
            Route::delete('/{id}', [VehicleController::class, 'destroy'])->name('admin.vehicles.destroy');
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

        Route::prefix('parking-rates')->group(function () {
            Route::get('/', [ParkingRateController::class, 'index'])->name('admin.parking-rates.index');
            Route::get('/create', [ParkingRateController::class, 'showCreate'])->name('admin.parking-rates.create');
            Route::post('/', [ParkingRateController::class, 'store'])->name('admin.parking-rates.store');
            Route::get('/{id}/edit', [ParkingRateController::class, 'showEdit'])->name('admin.parking-rates.edit');
            Route::put('/{id}', [ParkingRateController::class, 'update'])->name('admin.parking-rates.update');
            Route::delete('/{id}', [ParkingRateController::class, 'destroy'])->name('admin.parking-rates.destroy');
        });

        Route::prefix('activity-logs')->group(function () {
            Route::get('/', [ActivityLogController::class, 'index'])->name('admin.activity-logs.index');
            Route::delete('/{id}', [ActivityLogController::class, 'destroy'])->name('admin.activity-logs.destroy');
        });

        Route::prefix('accounts')->group(function () {
            Route::get('/', [AdminAccountController::class, 'index'])->name('admin.accounts.index');
            Route::get('/create', [AdminAccountController::class, 'showCreate'])->name('admin.accounts.create');
            Route::post('/', [AdminAccountController::class, 'store'])->name('admin.accounts.store');
            Route::post('/{user}/activate', [AdminAccountController::class, 'activate'])->name('admin.accounts.activate');
            Route::put('/{user}/reset-email', [AdminAccountController::class, 'resetEmail'])->name('admin.accounts.reset-email');
            Route::put('/{user}/identity', [AdminAccountController::class, 'updateIdentity'])->name('admin.accounts.update-identity');
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
        Route::get('/', [TransactionController::class, 'index'])->name('officer.dashboard');
        Route::get('/standby/in', [TransactionController::class, 'standbyIn'])->name('officer.standby.in');
        Route::get('/standby/out', [TransactionController::class, 'standbyOut'])->name('officer.standby.out');
        Route::get('/rfid-lookup', [TransactionController::class, 'lookupVehiclesByRfid'])->name('officer.rfid.lookup');
        Route::post('/transactions', [TransactionController::class, 'store'])->name('officer.transactions.store');
        Route::get('/visitor-vehicles/create', [TransactionController::class, 'showVisitorVehicleCreate'])->name('officer.visitor-vehicles.create');
        Route::post('/visitor-vehicles', [TransactionController::class, 'storeVisitorVehicle'])->name('officer.visitor-vehicles.store');
        Route::get('/transactions/{transaction}/receipt', [TransactionController::class, 'showReceipt'])->name('officer.transactions.receipt');
        Route::post('/transactions/{transaction}/receipt/confirm', [TransactionController::class, 'confirmReceipt'])->name('officer.transactions.receipt.confirm');
        Route::get('/dashboard', fn () => redirect()->route('officer.dashboard'));
        Route::get('/parking', fn () => redirect()->route('officer.dashboard'));
        Route::get('/{any}', fn () => redirect()->route('officer.dashboard'))->where('any', '.*');
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
