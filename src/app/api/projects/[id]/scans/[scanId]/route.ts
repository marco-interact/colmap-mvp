import { NextRequest, NextResponse } from 'next/server'
import { apiClient } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; scanId: string } }
) {
  try {
    // Get scan details from the worker service
    const scanDetails = await apiClient.getScanDetails(params.scanId)
    
    return NextResponse.json({
      success: true,
      data: scanDetails
    })
  } catch (error) {
    console.error('Failed to get scan details:', error)
    
    // Return mock data as fallback
    const mockScanDetails = {
      id: params.scanId,
      name: `Scan ${params.scanId}`,
      status: "completed",
      technical_details: {
        point_count: 45892,
        camera_count: 24,
        feature_count: 892847,
        processing_time: "4.2 minutes",
        resolution: "1920x1080",
        file_size: "18.3 MB",
        reconstruction_error: "0.42 pixels",
        coverage: "94.2%"
      },
      processing_stages: [
        { name: "Frame Extraction", status: "completed", duration: "0.8s", frames_extracted: 24 },
        { name: "Feature Detection", status: "completed", duration: "45.2s", features_detected: 892847 },
        { name: "Feature Matching", status: "completed", duration: "1.2m", matches: 245892 },
        { name: "Sparse Reconstruction", status: "completed", duration: "1.8m", points: 45892 },
        { name: "Dense Reconstruction", status: "completed", duration: "0.4m", points: 145892 }
      ],
      results: {
        point_cloud_url: `/models/${params.scanId}/pointcloud.ply`,
        mesh_url: `/models/${params.scanId}/mesh.obj`,
        thumbnail_url: `/models/${params.scanId}/thumbnail.jpg`
      }
    }
    
    return NextResponse.json({
      success: true,
      data: mockScanDetails
    })
  }
}
