import { NextRequest, NextResponse } from 'next/server'
import { addScan, getNextScanId } from '@/lib/mockData'

// Mock scans data (shared with projects/[id]/scans)
let scans: any[] = [
  {
    id: '1',
    name: 'Scan 1', 
    project_id: '1',
    status: 'completed',
    thumbnail: null,
    video_filename: null,
    video_size: null,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  }
]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const projectId = formData.get('projectId') as string
    const video = formData.get('video') as File
    const quality = formData.get('quality') as string || 'medium'
    const denseReconstruction = formData.get('denseReconstruction') === 'true'
    const meshing = formData.get('meshing') === 'true'
    const frameRate = parseInt(formData.get('frameRate') as string) || 1

    if (!name || !projectId || !video) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!video.type.startsWith('video/')) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Please upload a video file.' },
        { status: 400 }
      )
    }

    // Validate file size (max 1GB)
    const maxSize = 1024 * 1024 * 1024 // 1GB
    if (video.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File too large. Maximum size is 1GB.' },
        { status: 400 }
      )
    }

    // Create new scan - for demo, make it immediately completed
    const newScan: any = {
      id: getNextScanId(),
      name,
      project_id: projectId,
      status: 'completed', // Immediately completed for demo
      thumbnail: null,
      model_url: '/models/sample.ply', // Use sample PLY file
      video_filename: video.name,
      video_size: video.size,
      processing_options: {
        quality,
        dense_reconstruction: denseReconstruction,
        meshing,
        frame_rate: frameRate
      },
      processing_jobs: [] as any[],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    addScan(newScan)

    // Start COLMAP processing pipeline
    try {
      // First, upload video to COLMAP worker
      const colmapWorkerUrl = process.env.COLMAP_WORKER_URL || 'http://localhost:8001'
      
      const uploadFormData = new FormData()
      uploadFormData.append('file', video)
      uploadFormData.append('project_id', projectId)
      
      const uploadResponse = await fetch(`${colmapWorkerUrl}/upload-video`, {
        method: 'POST',
        body: uploadFormData
      })
      
      if (uploadResponse.ok) {
        // Start frame extraction
        const extractResponse = await fetch(`${colmapWorkerUrl}/extract-frames`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            quality,
            dense_reconstruction: denseReconstruction,
            meshing,
            texturing: false,
            frame_extraction_rate: frameRate
          })
        })
        
        if (extractResponse.ok) {
          const extractData = await extractResponse.json()
          newScan.processing_jobs.push({
            job_id: extractData.job_id,
            type: 'frame_extraction',
            status: 'running'
          })
        }
      }
    } catch (error) {
      console.error('COLMAP processing initiation failed:', error)
      newScan.status = 'failed'
    }
    
    return NextResponse.json({
      success: true,
      data: newScan,
      message: 'Scan created successfully'
    })
  } catch (error) {
    console.error('Error creating scan:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create scan' },
      { status: 500 }
    )
  }
}
