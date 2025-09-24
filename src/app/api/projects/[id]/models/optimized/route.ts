/**
 * API endpoint for serving Open3D optimized 3D models
 * Serves web-optimized point clouds and meshes processed by Open3D
 * Falls back to original COLMAP outputs if optimized versions aren't available
 */

import { NextRequest, NextResponse } from 'next/server'
import { mockDB } from '@/lib/database/mockDatabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const fileType = searchParams.get('type') // 'pointcloud', 'mesh', 'mesh_obj', 'metadata'
    
    if (!fileType) {
      return NextResponse.json(
        { success: false, message: 'File type parameter required' },
        { status: 400 }
      )
    }

    // Validate project exists
    const project = mockDB.getProjectById(projectId)
    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      )
    }

    // Get scans for this project
    const scans = mockDB.getScansByProject(projectId)
    if (scans.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No scans found for project' },
        { status: 404 }
      )
    }

    // For demo, use the first completed scan
    const completedScan = scans.find(scan => scan.status === 'completed')
    if (!completedScan) {
      return NextResponse.json(
        { success: false, message: 'No completed scans found' },
        { status: 404 }
      )
    }

    // Construct URLs for optimized models
    const colmapWorkerUrl = process.env.COLMAP_WORKER_URL || 'http://localhost:8001'
    const optimizedUrl = `${colmapWorkerUrl}/optimized/${projectId}/${fileType}`
    
    // Check if optimized version exists, otherwise use original
    try {
      const optimizedResponse = await fetch(optimizedUrl, { method: 'HEAD' })
      
      if (optimizedResponse.ok) {
        // Optimized version exists, serve it
        return NextResponse.json({
          success: true,
          data: {
            scan_id: completedScan.id,
            project_id: projectId,
            file_type: fileType,
            url: optimizedUrl,
            optimized: true,
            processing_info: {
              processor: 'Open3D',
              optimization_applied: true,
              web_optimized: true
            }
          }
        })
      }
    } catch (error) {
      console.warn('Could not check optimized model availability:', error)
    }

    // Fall back to original COLMAP output
    const originalFileMap: Record<string, string> = {
      'pointcloud': 'dense_cloud',
      'mesh': 'mesh',
      'mesh_obj': 'texture'
    }

    const originalType = originalFileMap[fileType]
    if (!originalType) {
      return NextResponse.json(
        { success: false, message: 'Unsupported file type' },
        { status: 400 }
      )
    }

    const originalUrl = `${colmapWorkerUrl}/download/${projectId}/${originalType}`
    
    return NextResponse.json({
      success: true,
      data: {
        scan_id: completedScan.id,
        project_id: projectId,
        file_type: fileType,
        url: originalUrl,
        optimized: false,
        processing_info: {
          processor: 'COLMAP',
          optimization_applied: false,
          web_optimized: false,
          note: 'Original COLMAP output - consider running Open3D optimization'
        }
      }
    })

  } catch (error) {
    console.error('Error serving optimized model:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to serve optimized model' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()
    const { config } = body

    // Validate project exists
    const project = mockDB.getProjectById(projectId)
    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      )
    }

    // Trigger Open3D optimization
    const colmapWorkerUrl = process.env.COLMAP_WORKER_URL || 'http://localhost:8001'
    const optimizationUrl = `${colmapWorkerUrl}/process-open3d/${projectId}`
    
    const response = await fetch(optimizationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ config })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      return NextResponse.json({
        success: true,
        data: {
          project_id: projectId,
          job_id: result.job_id,
          message: 'Open3D optimization started',
          status_url: `/api/projects/${projectId}/jobs/${result.job_id}`,
          estimated_time: '2-5 minutes'
        }
      })
    } else {
      return NextResponse.json(
        { success: false, message: result.detail || 'Failed to start optimization' },
        { status: response.status }
      )
    }

  } catch (error) {
    console.error('Error starting Open3D optimization:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to start optimization' },
      { status: 500 }
    )
  }
}
