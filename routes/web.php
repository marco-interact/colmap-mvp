<?php

use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ScanController;
use App\Http\Controllers\ColmapController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    if (Auth::check()) {
        return redirect('/dashboard');
    }
    return redirect('/login');
});

// Legacy redirect for Laravel's default /home
Route::get('/home', function () {
    return redirect('/dashboard');
});

// Authentication Routes
Auth::routes();

// Protected Routes
Route::middleware(['auth'])->group(function () {
    
    // Dashboard
    Route::get('/dashboard', [ProjectController::class, 'dashboard'])->name('dashboard');
    
    // Project Routes
    Route::resource('projects', ProjectController::class);
    Route::get('/projects/{project}/scans', [ProjectController::class, 'scans'])->name('projects.scans');
    Route::get('/projects/recent', [ProjectController::class, 'recent'])->name('projects.recent');
    
    // Scan Routes
    Route::resource('scans', ScanController::class);
    Route::post('/scans/{scan}/upload-video', [ScanController::class, 'uploadVideo'])->name('scans.upload-video');
    Route::post('/scans/{scan}/extract-frames', [ScanController::class, 'extractFrames'])->name('scans.extract-frames');
    Route::post('/scans/{scan}/start-processing', [ScanController::class, 'startProcessing'])->name('scans.start-processing');
    
    // COLMAP Integration Routes
    Route::prefix('colmap')->name('colmap.')->controller(ColmapController::class)->group(function () {
        Route::post('/upload-video', 'uploadVideo')->name('upload-video');
        Route::post('/extract-frames', 'extractFrames')->name('extract-frames');
        Route::post('/start-reconstruction', 'startReconstruction')->name('start-reconstruction');
        Route::get('/jobs/{jobId}', 'getJobStatus')->name('job-status');
        Route::get('/download/{projectId}/{fileType}', 'downloadFile')->name('download');
    });
    
    // Settings & Help
    Route::get('/settings', function() {
        return view('settings');
    })->name('settings');
    
    Route::get('/help', function() {
        return view('help');
    })->name('help');
});

// Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now(),
        'services' => [
            'laravel' => 'running',
            'database' => 'connected',
        ]
    ]);
});