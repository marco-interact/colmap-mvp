<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Scan;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class VideoController extends Controller
{
    /**
     * Upload video for a scan
     */
    public function upload(Request $request, Scan $scan): JsonResponse
    {
        // Verify user can access the project
        if (!auth()->user()->canAccessProject($scan->project)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'video' => 'required|file|mimes:mp4,avi,mov,mkv|max:1048576' // 1GB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $videoFile = $request->file('video');
            $filename = Str::uuid() . '.' . $videoFile->getClientOriginalExtension();
            $path = $videoFile->storeAs('videos/' . $scan->project_id, $filename, 'local');

            // Update scan with video information
            $scan->update([
                'video_filename' => $videoFile->getClientOriginalName(),
                'video_path' => $path,
                'video_size' => $videoFile->getSize(),
                'status' => 'uploaded'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Video uploaded successfully',
                'scan' => $scan->fresh(),
                'file_info' => [
                    'filename' => $filename,
                    'size' => $videoFile->getSize(),
                    'path' => $path
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload video: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extract frames from video
     */
    public function extractFrames(Request $request, Scan $scan): JsonResponse
    {
        if (!auth()->user()->canAccessProject($scan->project)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($scan->status !== 'uploaded') {
            return response()->json([
                'success' => false,
                'message' => 'Video must be uploaded first'
            ], 400);
        }

        try {
            // Update scan status
            $scan->update(['status' => 'extracting']);

            // Call Python COLMAP service to extract frames
            $colmapService = app('colmap.service');
            $response = $colmapService->extractFrames($scan);

            if ($response['success']) {
                $scan->update([
                    'status' => 'frames_extracted',
                    'frames_extracted' => $response['frames_count']
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Frames extracted successfully',
                    'frames_count' => $response['frames_count'],
                    'scan' => $scan->fresh()
                ]);
            } else {
                $scan->update(['status' => 'failed']);
                return response()->json([
                    'success' => false,
                    'message' => $response['message']
                ], 500);
            }

        } catch (\Exception $e) {
            $scan->update(['status' => 'failed']);
            return response()->json([
                'success' => false,
                'message' => 'Failed to extract frames: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get video processing status
     */
    public function status(Scan $scan): JsonResponse
    {
        if (!auth()->user()->canAccessProject($scan->project)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'scan_id' => $scan->id,
            'status' => $scan->status,
            'progress' => $scan->processingJobs()->latest()->first()?->progress ?? 0,
            'message' => $scan->processingJobs()->latest()->first()?->message ?? '',
            'frames_extracted' => $scan->frames_extracted,
            'video_size' => $scan->video_size,
            'created_at' => $scan->created_at,
            'updated_at' => $scan->updated_at
        ]);
    }

    /**
     * Download video file
     */
    public function download(Scan $scan): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        if (!auth()->user()->canAccessProject($scan->project)) {
            abort(403, 'Unauthorized');
        }

        if (!$scan->video_path || !Storage::exists($scan->video_path)) {
            abort(404, 'Video file not found');
        }

        return Storage::download($scan->video_path, $scan->video_filename);
    }
}
