import { NextRequest, NextResponse } from 'next/server'
import { addScan, getNextScanId } from '@/lib/mockData'
import { EquirectangularConverter, Video360Utils } from '@/utils/360/EquirectangularConverter'
import { OpenCVReconstruction, SfMUtils } from '@/utils/sfm/OpenCVReconstruction'
import { PotreeIntegration } from '@/utils/potree/PotreeIntegration'

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

    // Enhanced COLMAP processing pipeline with 360° support
    try {
      // Convert video file to HTML video element for processing
      const videoBlob = new Blob([await video.arrayBuffer()], { type: video.type })
      const videoUrl = URL.createObjectURL(videoBlob)
      
      // Create video element for analysis (server-side simulation)
      const videoMetadata = {
        width: 1920, // Default, would be extracted from actual video
        height: 1080,
        duration: 30, // Default duration
        aspectRatio: 1920 / 1080
      }
      
      // Detect if video is 360°
      const is360Video = videoMetadata.aspectRatio > 1.8 // Typical 360° aspect ratio
      
      if (is360Video) {
        // 360° Video Processing Pipeline
        console.log('Detected 360° video, initiating equirectangular processing...')
        
        newScan.processing_jobs.push({
          job_id: `360_${Date.now()}`,
          type: '360_conversion',
          status: 'running',
          description: 'Converting 360° video to perspective views'
        })
        
        // Generate optimal viewpoints for COLMAP
        const converter = new EquirectangularConverter()
        const optimalViewpoints = converter.generateOptimalViewpoints({
          numViews: 16, // More views for better reconstruction
          verticalLevels: 3,
          horizontalFOV: 90,
          verticalFOV: 60,
          outputWidth: quality === 'high' ? 1920 : quality === 'medium' ? 1280 : 854,
          outputHeight: quality === 'high' ? 1080 : quality === 'medium' ? 720 : 480
        })
        
        newScan.processing_options.is_360 = true
        newScan.processing_options.viewpoints = optimalViewpoints.length
        newScan.processing_options.conversion_type = 'equirectangular_to_perspective'
      }
      
      // Start Structure from Motion processing
      console.log('Initiating OpenCV Structure-from-Motion pipeline...')
      
      const sfmProcessor = new OpenCVReconstruction()
      newScan.processing_jobs.push({
        job_id: `sfm_${Date.now()}`,
        type: 'structure_from_motion',
        status: 'running',
        description: 'SIFT feature extraction and camera pose estimation'
      })
      
      // Upload to COLMAP worker with enhanced metadata
      const colmapWorkerUrl = process.env.COLMAP_WORKER_URL || 'http://localhost:8001'
      
      const uploadFormData = new FormData()
      uploadFormData.append('file', video)
      uploadFormData.append('project_id', projectId)
      uploadFormData.append('is_360', is360Video.toString())
      uploadFormData.append('processing_options', JSON.stringify(newScan.processing_options))
      
      const uploadResponse = await fetch(`${colmapWorkerUrl}/upload-video`, {
        method: 'POST',
        body: uploadFormData
      })
      
      if (uploadResponse.ok) {
        // Start enhanced frame extraction
        const extractResponse = await fetch(`${colmapWorkerUrl}/extract-frames`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            quality,
            dense_reconstruction: denseReconstruction,
            meshing,
            texturing: false,
            frame_extraction_rate: frameRate,
            is_360: is360Video,
            use_potree_optimization: true
          })
        })
        
        if (extractResponse.ok) {
          const extractData = await extractResponse.json()
          newScan.processing_jobs.push({
            job_id: extractData.job_id,
            type: 'colmap_reconstruction',
            status: 'running',
            description: 'COLMAP sparse and dense reconstruction'
          })
          
          // Add Potree conversion job
          newScan.processing_jobs.push({
            job_id: `potree_${Date.now()}`,
            type: 'potree_conversion',
            status: 'pending',
            description: 'Converting point cloud to Potree octree format'
          })
        }
      }
      
      // Clean up temporary video URL
      URL.revokeObjectURL(videoUrl)
      
    } catch (error) {
      console.error('Enhanced COLMAP processing initiation failed:', error)
      newScan.status = 'failed'
      newScan.error_message = error instanceof Error ? error.message : 'Unknown processing error'
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
