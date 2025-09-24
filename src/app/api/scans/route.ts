import { NextRequest, NextResponse } from 'next/server'

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

    // Create new scan
    const newScan = {
      id: (scans.length + 1).toString(),
      name,
      project_id: projectId,
      status: 'uploaded',
      thumbnail: null,
      video_filename: video.name,
      video_size: video.size,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    scans.push(newScan)

    // In a real app, you would:
    // 1. Save the video file to storage (S3, etc.)
    // 2. Queue a job for COLMAP processing
    // 3. Update scan status to 'processing'
    
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
