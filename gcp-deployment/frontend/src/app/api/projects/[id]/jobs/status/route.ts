import { NextRequest, NextResponse } from 'next/server'

// Mock COLMAP processing jobs
const mockJobStatuses = {
  frame_extraction: {
    id: 'job_frame_extraction',
    name: 'Frame Extraction',
    status: 'completed',
    progress: 100,
    started_at: '2024-01-15T10:00:00Z',
    completed_at: '2024-01-15T10:02:30Z',
    duration: 150, // seconds
    output: {
      total_frames: 240,
      extracted_frames: 48,
      frame_rate: '1fps',
      resolution: '1920x1080'
    },
    logs: [
      'Starting frame extraction from video...',
      'Detected video: 1920x1080, 24fps, 10s duration',
      'Extracting frames at 1fps interval...',
      'Successfully extracted 48 frames',
      'Frame extraction completed'
    ]
  },
  feature_extraction: {
    id: 'job_feature_extraction',
    name: 'Feature Extraction',
    status: 'completed',
    progress: 100,
    started_at: '2024-01-15T10:02:30Z',
    completed_at: '2024-01-15T10:08:45Z',
    duration: 375,
    output: {
      total_features: 892340,
      average_per_image: 18590,
      feature_type: 'SIFT',
      descriptor_size: 128
    },
    logs: [
      'Starting SIFT feature extraction...',
      'Processing 48 images...',
      'Extracted features from frame_001.jpg: 19234 features',
      'Extracted features from frame_002.jpg: 18756 features',
      '...',
      'Feature extraction completed: 892,340 total features'
    ]
  },
  feature_matching: {
    id: 'job_feature_matching',
    name: 'Feature Matching',
    status: 'completed', 
    progress: 100,
    started_at: '2024-01-15T10:08:45Z',
    completed_at: '2024-01-15T10:15:20Z',
    duration: 395,
    output: {
      total_matches: 156789,
      image_pairs: 1128,
      matching_strategy: 'exhaustive',
      verification_method: 'fundamental_matrix'
    },
    logs: [
      'Starting exhaustive feature matching...',
      'Matching features between 1,128 image pairs...',
      'Verified matches using fundamental matrix estimation...',
      'Feature matching completed: 156,789 verified matches'
    ]
  },
  sparse_reconstruction: {
    id: 'job_sparse_reconstruction',
    name: 'Sparse Reconstruction (SfM)',
    status: 'completed',
    progress: 100,
    started_at: '2024-01-15T10:15:20Z',
    completed_at: '2024-01-15T10:22:10Z',
    duration: 410,
    output: {
      reconstructed_cameras: 45,
      sparse_points: 15420,
      reprojection_error: 0.68,
      reconstruction_method: 'incremental'
    },
    logs: [
      'Starting incremental sparse reconstruction...',
      'Initializing reconstruction with best image pair...',
      'Registering cameras: 3/48 (6.25%)',
      'Registering cameras: 15/48 (31.25%)',
      'Registering cameras: 30/48 (62.5%)',
      'Registering cameras: 45/48 (93.75%)',
      'Triangulating 3D points...',
      'Bundle adjustment optimization...',
      'Sparse reconstruction completed: 45 cameras, 15,420 points'
    ]
  },
  dense_reconstruction: {
    id: 'job_dense_reconstruction',
    name: 'Dense Reconstruction (MVS)',
    status: 'running',
    progress: 75,
    started_at: '2024-01-15T10:22:10Z',
    estimated_completion: '2024-01-15T10:35:00Z',
    current_stage: 'patch_match_stereo',
    output: {
      processed_views: 34,
      total_views: 45,
      dense_points_so_far: 2134567,
      patch_match_window: 11
    },
    logs: [
      'Starting dense reconstruction using patch-match stereo...',
      'Computing depth maps for all views...',
      'Processing view 1/45: depth map computation...',
      'Processing view 15/45: depth map computation...',
      'Processing view 30/45: depth map computation...',
      'Currently processing view 34/45...'
    ]
  },
  meshing: {
    id: 'job_meshing',
    name: 'Surface Reconstruction',
    status: 'pending',
    progress: 0,
    estimated_start: '2024-01-15T10:35:00Z',
    output: null,
    logs: [
      'Waiting for dense reconstruction to complete...'
    ]
  },
  texturing: {
    id: 'job_texturing',
    name: 'Texture Mapping',
    status: 'pending',
    progress: 0,
    estimated_start: '2024-01-15T10:45:00Z',
    output: null,
    logs: [
      'Waiting for mesh generation to complete...'
    ]
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')
    
    // If specific job requested
    if (jobId && mockJobStatuses[jobId as keyof typeof mockJobStatuses]) {
      const job = mockJobStatuses[jobId as keyof typeof mockJobStatuses]
      return NextResponse.json({
        success: true,
        data: job,
        project_id: projectId
      })
    }
    
    // Return all jobs status
    const jobs = Object.values(mockJobStatuses)
    const completedJobs = jobs.filter(job => job.status === 'completed')
    const runningJobs = jobs.filter(job => job.status === 'running')
    const pendingJobs = jobs.filter(job => job.status === 'pending')
    const failedJobs = jobs.filter(job => job.status === 'failed')
    
    // Calculate overall progress
    const totalJobs = jobs.length
    const overallProgress = Math.round((completedJobs.length / totalJobs) * 100)
    
    // Determine overall status
    let overallStatus = 'pending'
    if (runningJobs.length > 0) {
      overallStatus = 'running'
    } else if (completedJobs.length === totalJobs) {
      overallStatus = 'completed'
    } else if (failedJobs.length > 0) {
      overallStatus = 'failed'
    }
    
    // Current stage
    const currentJob = runningJobs[0] || pendingJobs[0]
    const currentStage = currentJob ? currentJob.name : 'All stages completed'
    
    return NextResponse.json({
      success: true,
      data: {
        overall_status: overallStatus,
        overall_progress: overallProgress,
        current_stage: currentStage,
        total_jobs: totalJobs,
        completed_jobs: completedJobs.length,
        running_jobs: runningJobs.length,
        pending_jobs: pendingJobs.length,
        failed_jobs: failedJobs.length,
        jobs: jobs,
        pipeline_stages: [
          'frame_extraction',
          'feature_extraction', 
          'feature_matching',
          'sparse_reconstruction',
          'dense_reconstruction',
          'meshing',
          'texturing'
        ],
        estimated_total_time: '45 minutes',
        started_at: (jobs[0] as any)?.started_at,
        estimated_completion: (currentJob as any)?.estimated_completion
      },
      project_id: projectId,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error fetching job status:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch job status',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
