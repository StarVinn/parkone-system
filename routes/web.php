<?php

use Illuminate\Support\Facades\Route;

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
Route::post('/register', [App\Http\Controllers\Web\AuthController::class, 'register']);

/*
|--------------------------------------------------------------------------
| ADMIN
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::prefix('admin')->group(function () {
        Route::get('/', function () {
            return view('admin.dashboard');
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
            return view('officer.dashboard');
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
            return view('owner.dashboard');
        });
    });
});