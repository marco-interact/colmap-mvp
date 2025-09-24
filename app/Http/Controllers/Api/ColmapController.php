<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Scan;
use App\Models\Asset3D;
use App\Models\ProcessingJob;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ColmapController extends Controller
{
    private $colmapServiceUrl;

    public function __construct()
    {
        $this->colmapServiceUrl = config('app.colmap_service_url', 'https://python-colmap.vercel.app');
    }

    /**
     * Start COLMAP reconstruction process
     */
    public function startReconstruction(Request $request, Scan $scan): JsonResponse
    {
        if (!auth()->user()->canAccessProject($scan->project)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($scan->status !== 'frames_extracted') {
            return response()->json([
                'success' => false,
                'message' => 'Frames must be extracted first'
            ], 400);
        }

        try {
            // Create processing job
            $job = ProcessingJob::create([
                'job_id' => Str::uuid(),
                'scan_id' => $scan->id,
                'type' => 'reconstruction',
                'status' => 'pending',
                'request_data' => $request->all()
            ]);

            // Update scan status
            $scan->update(['status' => 'processing']);

            // Call Python COLMAP service
            $response = Http::timeout(30)->post($this->colmapServiceUrl . '/api/colmap/start-reconstruction', [
                'scan_id' => $scan->id,
                'job_id' => $job->job_id,
                'frames_path' => $scan->getFramesPath(),
                'output_path' => $scan->getOutputPath(),
                'quality' => $request->get('quality', 'medium'),
                'camera_model' => $request->get('camera_model', 'SIMPLE_PINHOLE')
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                $job->update([
                    'status' => 'processing',
                    'message' => 'COLMAP reconstruction started'
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'COLMAP reconstruction started',
                    'job_id' => $job->job_id,
                    'scan' => $scan->fresh()
                ]);
            } else {
                $job->update([
                    'status' => 'failed',
                    'message' => 'Failed to start reconstruction'
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to start COLMAP reconstruction'
                ], 500);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error starting reconstruction: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get job status
     */
    public function getJobStatus(string $jobId): JsonResponse
    {
        try {
            $job = ProcessingJob::where('job_id', $jobId)->firstOrFail();
            
            if (!auth()->user()->canAccessProject($job->scan->project)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Check with Python service for latest status
            $response = Http::timeout(10)->get($this->colmapServiceUrl . '/api/colmap/job-status/' . $jobId);
            
            if ($response->successful()) {
                $data = $response->json();
                
                // Update job status
                $job->update([
                    'status' => $data['status'],
                    'progress' => $data['progress'],
                    'message' => $data['message'],
                    'results' => $data['results'] ?? null
                ]);

                // If completed, create 3D assets
                if ($data['status'] === 'completed' && isset($data['results'])) {
                    $this->createAssetsFromResults($job->scan, $data['results']);
                }
            }

            return response()->json([
                'job_id' => $job->job_id,
                'status' => $job->status,
                'progress' => $job->progress,
                'message' => $job->message,
                'results' => $job->results,
                'started_at' => $job->started_at,
                'completed_at' => $job->completed_at
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error getting job status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download generated file
     */
    public function downloadFile(string $jobId, string $filename): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $job = ProcessingJob::where('job_id', $jobId)->firstOrFail();
        
        if (!auth()->user()->canAccessProject($job->scan->project)) {
            abort(403, 'Unauthorized');
        }

        // Get file from Python service
        $response = Http::timeout(30)->get($this->colmapServiceUrl . '/api/colmap/download-file/' . $jobId . '/' . $filename);
        
        if (!$response->successful()) {
            abort(404, 'File not found');
        }

        return response()->streamDownload(function () use ($response) {
            echo $response->body();
        }, $filename);
    }

    /**
     * Health check for COLMAP service
     */
    public function healthCheck(): JsonResponse
    {
        try {
            $response = Http::timeout(5)->get($this->colmapServiceUrl . '/api/health');
            
            return response()->json([
                'service' => 'colmap',
                'status' => $response->successful() ? 'healthy' : 'unhealthy',
                'response_time' => $response->transferStats?->getHandlerStat('total_time') ?? 0,
                'timestamp' => now()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'service' => 'colmap',
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'timestamp' => now()
            ], 503);
        }
    }

    /**
     * Create 3D assets from COLMAP results
     */
    private function createAssetsFromResults(Scan $scan, array $results): void
    {
        $project = $scan->project;

        // Create point cloud asset
        if (isset($results['point_cloud'])) {
            Asset3D::create([
                'project_id' => $project->id,
                'scan_id' => $scan->id,
                'name' => 'Point Cloud - ' . $scan->name,
                'type' => 'point_cloud',
                'file_path' => $results['point_cloud']['path'],
                'file_format' => 'ply',
                'file_size' => $results['point_cloud']['size'],
                'metadata' => $results['point_cloud']['metadata'],
                'processing_params' => $results['processing_params'],
                'status' => 'completed',
                'processed_at' => now()
            ]);
        }

        // Create mesh asset
        if (isset($results['mesh'])) {
            Asset3D::create([
                'project_id' => $project->id,
                'scan_id' => $scan->id,
                'name' => 'Mesh - ' . $scan->name,
                'type' => 'mesh',
                'file_path' => $results['mesh']['path'],
                'file_format' => 'obj',
                'file_size' => $results['mesh']['size'],
                'metadata' => $results['mesh']['metadata'],
                'processing_params' => $results['processing_params'],
                'status' => 'completed',
                'processed_at' => now()
            ]);
        }

        // Create textured model asset
        if (isset($results['textured_model'])) {
            Asset3D::create([
                'project_id' => $project->id,
                'scan_id' => $scan->id,
                'name' => 'Textured Model - ' . $scan->name,
                'type' => 'model',
                'file_path' => $results['textured_model']['path'],
                'file_format' => 'gltf',
                'file_size' => $results['textured_model']['size'],
                'metadata' => $results['textured_model']['metadata'],
                'processing_params' => $results['processing_params'],
                'status' => 'completed',
                'processed_at' => now()
            ]);
        }

        // Update scan status
        $scan->update([
            'status' => 'completed',
            'processing_results' => $results
        ]);
    }
}
