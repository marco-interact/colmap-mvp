<?php

namespace App\Http\Controllers;

use App\Models\Scan;
use App\Models\ProcessingJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class ColmapController extends Controller
{
    protected $colmapServiceUrl;

    public function __construct()
    {
        $this->colmapServiceUrl = env('COLMAP_SERVICE_URL', 'http://localhost:8001');
    }

    /**
     * Upload video to COLMAP service
     */
    public function uploadVideo(Request $request)
    {
        $request->validate([
            'video' => 'required|file|mimes:mp4,avi,mov,mkv|max:1048576', // 1GB
            'project_id' => 'required|exists:projects,id'
        ]);

        try {
            // Forward the request to Python COLMAP service
            $response = Http::timeout(300)
                ->attach('file', $request->file('video')->getContent(), $request->file('video')->getClientOriginalName())
                ->post($this->colmapServiceUrl . '/upload-video', [
                    'project_id' => $request->project_id
                ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json([
                'success' => false,
                'message' => 'Error uploading video to COLMAP service'
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error connecting to COLMAP service: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extract frames from video
     */
    public function extractFrames(Request $request)
    {
        $request->validate([
            'project_id' => 'required|string',
            'frame_extraction_rate' => 'integer|min:1|max:30'
        ]);

        try {
            $response = Http::timeout(60)
                ->post($this->colmapServiceUrl . '/extract-frames', [
                    'project_id' => $request->project_id,
                    'frame_extraction_rate' => $request->frame_extraction_rate ?? 1
                ]);

            if ($response->successful()) {
                $data = $response->json();
                
                // Store job in our database
                if (isset($data['job_id'])) {
                    ProcessingJob::create([
                        'job_id' => $data['job_id'],
                        'scan_id' => $request->scan_id,
                        'type' => 'frame_extraction',
                        'status' => 'pending',
                        'progress' => 0,
                        'message' => 'Frame extraction started',
                        'request_data' => $request->all(),
                        'started_at' => now()
                    ]);
                }
                
                return response()->json($data);
            }

            return response()->json([
                'success' => false,
                'message' => 'Error starting frame extraction'
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error connecting to COLMAP service: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start COLMAP reconstruction
     */
    public function startReconstruction(Request $request)
    {
        $request->validate([
            'project_id' => 'required|string',
            'quality' => 'in:low,medium,high,extreme',
            'dense_reconstruction' => 'boolean',
            'meshing' => 'boolean',
            'texturing' => 'boolean'
        ]);

        try {
            $response = Http::timeout(60)
                ->post($this->colmapServiceUrl . '/start-reconstruction', [
                    'project_id' => $request->project_id,
                    'quality' => $request->quality ?? 'medium',
                    'dense_reconstruction' => $request->dense_reconstruction ?? true,
                    'meshing' => $request->meshing ?? true,
                    'texturing' => $request->texturing ?? false,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                
                // Store job in our database
                if (isset($data['job_id'])) {
                    ProcessingJob::create([
                        'job_id' => $data['job_id'],
                        'scan_id' => $request->scan_id,
                        'type' => 'reconstruction',
                        'status' => 'pending',
                        'progress' => 0,
                        'message' => 'COLMAP reconstruction started',
                        'request_data' => $request->all(),
                        'started_at' => now()
                    ]);
                }
                
                return response()->json($data);
            }

            return response()->json([
                'success' => false,
                'message' => 'Error starting COLMAP reconstruction'
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error connecting to COLMAP service: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get job status from COLMAP service
     */
    public function getJobStatus($jobId)
    {
        try {
            $response = Http::timeout(30)
                ->get($this->colmapServiceUrl . '/jobs/' . $jobId);

            if ($response->successful()) {
                $data = $response->json();
                
                // Update our local job record
                $job = ProcessingJob::where('job_id', $jobId)->first();
                if ($job) {
                    $job->update([
                        'status' => $data['status'],
                        'progress' => $data['progress'],
                        'message' => $data['message'],
                        'results' => $data['results'] ?? null,
                        'completed_at' => $data['status'] === 'completed' ? now() : null
                    ]);
                }
                
                return response()->json($data);
            }

            return response()->json([
                'success' => false,
                'message' => 'Error getting job status'
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error connecting to COLMAP service: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download processed files
     */
    public function downloadFile($projectId, $fileType)
    {
        try {
            $response = Http::timeout(300)
                ->get($this->colmapServiceUrl . "/download/{$projectId}/{$fileType}");

            if ($response->successful()) {
                $filename = $this->getFilenameForType($fileType);
                
                return response($response->body())
                    ->header('Content-Type', 'application/octet-stream')
                    ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
            }

            return response()->json([
                'success' => false,
                'message' => 'File not found'
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error downloading file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get appropriate filename for file type
     */
    private function getFilenameForType($fileType): string
    {
        $filenames = [
            'model' => 'model.ply',
            'dense' => 'dense_reconstruction.ply',
            'sparse' => 'sparse_reconstruction.ply',
            'mesh' => 'mesh.ply',
            'textured' => 'textured_mesh.obj'
        ];

        return $filenames[$fileType] ?? 'download.ply';
    }

    /**
     * Check COLMAP service health
     */
    public function healthCheck()
    {
        try {
            $response = Http::timeout(10)
                ->get($this->colmapServiceUrl . '/health');

            if ($response->successful()) {
                return response()->json([
                    'colmap_service' => 'healthy',
                    'data' => $response->json()
                ]);
            }

            return response()->json([
                'colmap_service' => 'unhealthy',
                'message' => 'Service not responding'
            ], 503);

        } catch (\Exception $e) {
            return response()->json([
                'colmap_service' => 'unreachable',
                'message' => $e->getMessage()
            ], 503);
        }
    }
}
