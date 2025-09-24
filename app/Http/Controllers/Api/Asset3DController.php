<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset3D;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class Asset3DController extends Controller
{
    /**
     * Get all 3D assets for a project
     */
    public function index(Project $project): JsonResponse
    {
        if (!auth()->user()->canAccessProject($project)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $assets = $project->assets3D()
            ->with(['scan'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'assets' => $assets->map(function ($asset) {
                return [
                    'id' => $asset->id,
                    'name' => $asset->name,
                    'type' => $asset->type,
                    'file_format' => $asset->file_format,
                    'file_size' => $asset->formatted_file_size,
                    'status' => $asset->status,
                    'metadata' => $asset->metadata,
                    'processed_at' => $asset->processed_at,
                    'scan' => $asset->scan ? [
                        'id' => $asset->scan->id,
                        'name' => $asset->scan->name
                    ] : null,
                    'download_url' => route('api.assets.download', $asset),
                    'viewer_url' => route('viewer.show', ['asset' => $asset->id])
                ];
            })
        ]);
    }

    /**
     * Get specific 3D asset
     */
    public function show(Asset3D $asset): JsonResponse
    {
        if (!auth()->user()->canAccessProject($asset->project)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'asset' => [
                'id' => $asset->id,
                'name' => $asset->name,
                'type' => $asset->type,
                'file_format' => $asset->file_format,
                'file_size' => $asset->formatted_file_size,
                'status' => $asset->status,
                'metadata' => $asset->metadata,
                'processing_params' => $asset->processing_params,
                'processed_at' => $asset->processed_at,
                'error_message' => $asset->error_message,
                'project' => [
                    'id' => $asset->project->id,
                    'name' => $asset->project->name
                ],
                'scan' => $asset->scan ? [
                    'id' => $asset->scan->id,
                    'name' => $asset->scan->name
                ] : null,
                'download_url' => route('api.assets.download', $asset),
                'viewer_url' => route('viewer.show', ['asset' => $asset->id])
            ]
        ]);
    }

    /**
     * Download 3D asset file
     */
    public function download(Asset3D $asset): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        if (!auth()->user()->canAccessProject($asset->project)) {
            abort(403, 'Unauthorized');
        }

        if (!$asset->isCompleted()) {
            abort(400, 'Asset is not ready for download');
        }

        if (!Storage::exists($asset->file_path)) {
            abort(404, 'Asset file not found');
        }

        $filename = $asset->name . '.' . $asset->file_format;
        return Storage::download($asset->file_path, $filename);
    }

    /**
     * Update asset metadata
     */
    public function update(Request $request, Asset3D $asset): JsonResponse
    {
        if (!auth()->user()->canAccessProject($asset->project)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'metadata' => 'sometimes|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $asset->update($request->only(['name', 'metadata']));

        return response()->json([
            'success' => true,
            'message' => 'Asset updated successfully',
            'asset' => $asset->fresh()
        ]);
    }

    /**
     * Delete 3D asset
     */
    public function destroy(Asset3D $asset): JsonResponse
    {
        if (!auth()->user()->canAccessProject($asset->project)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete file from storage
        if (Storage::exists($asset->file_path)) {
            Storage::delete($asset->file_path);
        }

        $asset->delete();

        return response()->json([
            'success' => true,
            'message' => 'Asset deleted successfully'
        ]);
    }

    /**
     * Get asset statistics
     */
    public function statistics(Project $project): JsonResponse
    {
        if (!auth()->user()->canAccessProject($project)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $assets = $project->assets3D();

        $stats = [
            'total_assets' => $assets->count(),
            'by_type' => $assets->selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type'),
            'by_status' => $assets->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status'),
            'by_format' => $assets->selectRaw('file_format, COUNT(*) as count')
                ->groupBy('file_format')
                ->pluck('count', 'file_format'),
            'total_size' => $assets->sum('file_size'),
            'average_size' => $assets->avg('file_size'),
            'latest_processed' => $assets->whereNotNull('processed_at')
                ->orderBy('processed_at', 'desc')
                ->first()?->processed_at
        ];

        return response()->json([
            'success' => true,
            'statistics' => $stats
        ]);
    }
}
