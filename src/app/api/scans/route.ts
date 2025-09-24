import { NextRequest, NextResponse } from 'next/server'
import { addScan, getNextScanId } from '@/lib/mockData'
import { mockDB } from '@/lib/database/mockDatabase'
import { fileStorage, initializeScanStorage } from '@/lib/services/fileStorage'

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

        // Get workspace and user info
        const workspace = mockDB.getWorkspaces()[0] // Default workspace
        const user = mockDB.getUserByEmail('test@colmap.app') // Default user
        
        if (!workspace || !user) {
          return NextResponse.json(
            { success: false, message: 'Invalid workspace or user configuration' },
            { status: 500 }
          )
        }

        // Generate scan ID and create storage structure
        const scanId = `scan-${Date.now()}`
        
        try {
          // Initialize file storage structure
          await initializeScanStorage(workspace.id, user.id, projectId, scanId)
          console.log(`Created storage structure for scan ${scanId}`)
        } catch (error) {
          console.error('Failed to initialize scan storage:', error)
        }

        // Create new scan with proper database structure
        const newScan: any = {
          name,
          project_id: projectId,
          user_id: user.id,
          workspace_id: workspace.id,
          status: 'completed', // Immediately completed for demo
          video_filename: video.name,
          video_size: video.size,
          video_path: `/storage/${workspace.id}/${user.id}/${projectId}/${scanId}/input/${video.name}`,
          processing_options: {
            quality,
            dense_reconstruction: denseReconstruction,
            meshing,
            frame_rate: frameRate
          },
          processing_jobs: [
            {
              job_id: `job-${Date.now()}-1`,
              type: 'frame_extraction',
              status: 'completed',
              progress: 100,
              description: 'Frame extraction completed',
              started_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
              completed_at: new Date(Date.now() - 8 * 60 * 1000).toISOString()
            },
            {
              job_id: `job-${Date.now()}-2`,
              type: 'sparse_reconstruction',
              status: 'completed',
              progress: 100,
              description: 'COLMAP sparse reconstruction completed',
              started_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
              completed_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
            },
            {
              job_id: `job-${Date.now()}-3`,
              type: 'dense_reconstruction',
              status: 'completed',
              progress: 100,
              description: 'COLMAP dense reconstruction completed',
              started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              completed_at: new Date().toISOString()
            }
          ],
          models: {
            sparse_cloud: `/storage/${workspace.id}/${user.id}/${projectId}/${scanId}/sparse/points3D.ply`,
            dense_cloud: `/storage/${workspace.id}/${user.id}/${projectId}/${scanId}/dense/fused.ply`,
            mesh: `/storage/${workspace.id}/${user.id}/${projectId}/${scanId}/mesh/meshed-poisson.ply`,
            thumbnails: [
              `/api/assets/sample-scan-thumbnail.jpg`
            ]
          },
          frame_count: Math.floor(30 * frameRate), // Approximate based on 30s video
          point_count: 125000 + Math.floor(Math.random() * 50000), // Random realistic count
          processing_time: 8 * 60, // 8 minutes
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const createdScan = addScan(newScan)

        // In production, this would trigger actual COLMAP processing
        console.log(`Created scan ${createdScan.id} for project ${projectId}`)
        console.log(`Storage structure initialized at: /storage/${workspace.id}/${user.id}/${projectId}/${scanId}`)

        // Trigger Open3D optimization in background (if COLMAP worker is available)
        try {
          const colmapWorkerUrl = process.env.COLMAP_WORKER_URL || 'http://localhost:8001'
          const optimizationUrl = `${colmapWorkerUrl}/process-open3d/${projectId}`
          
          // Fire and forget - don't wait for response
          fetch(optimizationUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              config: { 
                quality_profile: quality === 'high' ? 'web_high' : 'web_medium',
                point_cloud: { target_points: quality === 'high' ? 1000000 : 500000 },
                mesh: { decimation_target_triangles: quality === 'high' ? 500000 : 250000 }
              }
            })
          }).catch(error => {
            console.warn('Open3D optimization not available:', error.message)
          })
          
          console.log(`Triggered Open3D optimization for project ${projectId}`)
        } catch (error) {
          console.warn('Could not trigger Open3D optimization:', error)
        }
    
        return NextResponse.json({
          success: true,
          data: createdScan,
          message: 'Scan created successfully. Open3D optimization started in background.',
          optimization: {
            triggered: true,
            status: 'processing',
            estimated_time: '2-5 minutes'
          }
        })
  } catch (error) {
    console.error('Error creating scan:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create scan' },
      { status: 500 }
    )
  }
}
