<?php

namespace App\Http\Controllers;

use App\Models\Scan;
use App\Models\Project;
use App\Models\ProcessingJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ScanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $scans = Auth::user()->scans()
            ->with('project')
            ->latest()
            ->paginate(12);
            
        return view('scans.index', compact('scans'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $projects = Auth::user()->projects()->get();
        return view('scans.create', compact('projects'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'project_id' => 'required|exists:projects,id',
            'video' => 'required|file|mimes:mp4,avi,mov,mkv|max:1048576' // 1GB = 1048576 KB
        ]);

        if ($validator->fails()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }
            return back()->withErrors($validator)->withInput();
        }

        // Verify user owns the project
        $project = Project::where('id', $request->project_id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Handle video file upload
        $videoFile = $request->file('video');
        $videoPath = $videoFile->store('videos/' . $project->id, 'local');
        $videoSize = $videoFile->getSize();

        // Create scan record
        $scan = Scan::create([
            'name' => $request->name,
            'description' => $request->description,
            'project_id' => $project->id,
            'video_filename' => $videoFile->getClientOriginalName(),
            'video_path' => $videoPath,
            'video_size' => $videoSize,
            'status' => 'uploaded'
        ]);

        // Update project total scans count
        $project->increment('total_scans');

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'scan' => $scan,
                'redirect' => route('projects.show', $project)
            ]);
        }

        return redirect()->route('projects.show', $project)
            ->with('success', 'Scan creado exitosamente! Ahora puedes extraer los frames e iniciar la reconstrucción 3D.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Scan $scan)
    {
        // Ensure user owns the scan via project
        if ($scan->project->user_id !== Auth::id()) {
            abort(403);
        }

        $processingJobs = $scan->processingJobs()->latest()->get();
        
        return view('scans.show', compact('scan', 'processingJobs'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Scan $scan)
    {
        // Ensure user owns the scan via project
        if ($scan->project->user_id !== Auth::id()) {
            abort(403);
        }

        return view('scans.edit', compact('scan'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Scan $scan)
    {
        // Ensure user owns the scan via project
        if ($scan->project->user_id !== Auth::id()) {
            abort(403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $scan->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return redirect()->route('scans.show', $scan)
            ->with('success', 'Scan actualizado exitosamente!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Scan $scan)
    {
        // Ensure user owns the scan via project
        if ($scan->project->user_id !== Auth::id()) {
            abort(403);
        }

        // Delete video file if exists
        if ($scan->video_path && Storage::exists($scan->video_path)) {
            Storage::delete($scan->video_path);
        }

        $project = $scan->project;
        $scan->delete();

        // Update project total scans count
        $project->decrement('total_scans');

        return redirect()->route('projects.show', $project)
            ->with('success', 'Scan eliminado exitosamente!');
    }

    /**
     * Upload video for processing
     */
    public function uploadVideo(Request $request, Scan $scan)
    {
        // Ensure user owns the scan via project
        if ($scan->project->user_id !== Auth::id()) {
            abort(403);
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

        // Handle video file upload
        $videoFile = $request->file('video');
        $videoPath = $videoFile->store('videos/' . $scan->project_id, 'local');

        // Update scan with video info
        $scan->update([
            'video_filename' => $videoFile->getClientOriginalName(),
            'video_path' => $videoPath,
            'video_size' => $videoFile->getSize(),
            'status' => 'uploaded'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Video uploaded successfully!',
            'scan' => $scan
        ]);
    }

    /**
     * Extract frames from video
     */
    public function extractFrames(Request $request, Scan $scan)
    {
        // Ensure user owns the scan via project
        if ($scan->project->user_id !== Auth::id()) {
            abort(403);
        }

        if (!$scan->video_path) {
            return response()->json([
                'success' => false,
                'message' => 'No video file uploaded for this scan'
            ], 400);
        }

        // Update scan status
        $scan->update(['status' => 'extracting']);

        // Create processing job
        $job = ProcessingJob::create([
            'job_id' => 'extract_' . Str::random(10),
            'scan_id' => $scan->id,
            'type' => 'frame_extraction',
            'status' => 'pending',
            'started_at' => now()
        ]);

        // TODO: Integrate with COLMAP service
        // For now, simulate frame extraction
        $scan->update([
            'frames_extracted' => rand(50, 200),
            'status' => 'frames_extracted'
        ]);

        $job->update([
            'status' => 'completed',
            'progress' => 100,
            'completed_at' => now(),
            'results' => json_encode(['frames_count' => $scan->frames_extracted])
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Frames extracted successfully!',
            'scan' => $scan,
            'job' => $job
        ]);
    }

    /**
     * Start 3D reconstruction processing
     */
    public function startProcessing(Request $request, Scan $scan)
    {
        // Ensure user owns the scan via project
        if ($scan->project->user_id !== Auth::id()) {
            abort(403);
        }

        if ($scan->frames_extracted == 0) {
            return response()->json([
                'success' => false,
                'message' => 'No frames extracted yet. Please extract frames first.'
            ], 400);
        }

        // Update scan status
        $scan->update(['status' => 'processing']);

        // Create processing job
        $job = ProcessingJob::create([
            'job_id' => 'recon_' . Str::random(10),
            'scan_id' => $scan->id,
            'type' => 'reconstruction',
            'status' => 'pending',
            'started_at' => now()
        ]);

        // TODO: Integrate with COLMAP service
        // For now, simulate processing
        $scan->update([
            'status' => 'completed',
            'model_path' => 'models/' . $scan->project_id . '/' . $scan->id . '/model.ply'
        ]);

        $job->update([
            'status' => 'completed',
            'progress' => 100,
            'completed_at' => now(),
            'results' => json_encode(['model_path' => $scan->model_path])
        ]);

        return response()->json([
            'success' => true,
            'message' => '3D reconstruction completed successfully!',
            'scan' => $scan,
            'job' => $job
        ]);
    }
}
