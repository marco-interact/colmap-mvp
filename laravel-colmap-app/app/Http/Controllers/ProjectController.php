<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ProjectController extends Controller
{
    /**
     * Display the dashboard with user's projects.
     */
    public function dashboard()
    {
        $projects = Auth::user()->projects()->latest()->get();
        
        return view('dashboard', compact('projects'));
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $projects = Auth::user()->projects()->latest()->paginate(12);
        
        return view('projects.index', compact('projects'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('projects.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'location' => 'nullable|string|max:255',
            'space_type' => 'required|in:interior,exterior,industrial,residential,commercial',
            'project_type' => 'required|in:reconstruction,measurement,inspection,modeling,documentation',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $project = Project::create([
            'name' => $request->name,
            'description' => $request->description,
            'user_id' => Auth::id(),
            'settings' => [
                'location' => $request->location,
                'space_type' => $request->space_type,
                'project_type' => $request->project_type,
                'quality' => 'medium', // Default quality
            ],
            'status' => 'created'
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'project' => $project,
                'redirect' => route('projects.show', $project)
            ]);
        }

        return redirect()->route('projects.show', $project)
                        ->with('success', 'Proyecto creado exitosamente!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project)
    {
        // Ensure user owns the project
        if ($project->user_id !== Auth::id()) {
            abort(403);
        }

        $scans = $project->scans()->latest()->get();
        
        return view('projects.show', compact('project', 'scans'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Project $project)
    {
        // Ensure user owns the project
        if ($project->user_id !== Auth::id()) {
            abort(403);
        }

        return view('projects.edit', compact('project'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Project $project)
    {
        // Ensure user owns the project
        if ($project->user_id !== Auth::id()) {
            abort(403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'location' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $project->update([
            'name' => $request->name,
            'description' => $request->description,
            'settings' => array_merge($project->settings ?? [], [
                'location' => $request->location,
            ])
        ]);

        return redirect()->route('projects.show', $project)
                        ->with('success', 'Proyecto actualizado exitosamente!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project)
    {
        // Ensure user owns the project
        if ($project->user_id !== Auth::id()) {
            abort(403);
        }

        $project->delete();

        return redirect()->route('dashboard')
                        ->with('success', 'Proyecto eliminado exitosamente!');
    }

    /**
     * Show recent projects
     */
    public function recent()
    {
        $projects = Auth::user()->projects()
                        ->orderBy('last_processed_at', 'desc')
                        ->orderBy('updated_at', 'desc')
                        ->limit(10)
                        ->get();
        
        return view('projects.recent', compact('projects'));
    }

    /**
     * Show project scans
     */
    public function scans(Project $project)
    {
        // Ensure user owns the project
        if ($project->user_id !== Auth::id()) {
            abort(403);
        }

        $scans = $project->scans()->latest()->get();
        
        return view('projects.scans', compact('project', 'scans'));
    }
}
