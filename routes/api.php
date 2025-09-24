<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\VideoController;
use App\Http\Controllers\Api\ColmapController;
use App\Http\Controllers\Api\Asset3DController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Video processing routes
Route::middleware('auth')->group(function () {
    Route::post('/scans/{scan}/upload-video', [VideoController::class, 'upload']);
    Route::post('/scans/{scan}/extract-frames', [VideoController::class, 'extractFrames']);
    Route::get('/scans/{scan}/status', [VideoController::class, 'status']);
    Route::get('/scans/{scan}/download', [VideoController::class, 'download']);
});

// COLMAP processing routes
Route::middleware('auth')->group(function () {
    Route::post('/scans/{scan}/start-reconstruction', [ColmapController::class, 'startReconstruction']);
    Route::get('/jobs/{jobId}/status', [ColmapController::class, 'getJobStatus']);
    Route::get('/jobs/{jobId}/download/{filename}', [ColmapController::class, 'downloadFile']);
    Route::get('/colmap/health', [ColmapController::class, 'healthCheck']);
});

// 3D Assets routes
Route::middleware('auth')->group(function () {
    Route::get('/projects/{project}/assets', [Asset3DController::class, 'index']);
    Route::get('/assets/{asset}', [Asset3DController::class, 'show']);
    Route::get('/assets/{asset}/download', [Asset3DController::class, 'download']);
    Route::put('/assets/{asset}', [Asset3DController::class, 'update']);
    Route::delete('/assets/{asset}', [Asset3DController::class, 'destroy']);
    Route::get('/projects/{project}/assets/statistics', [Asset3DController::class, 'statistics']);
});
