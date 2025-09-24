import { NextRequest, NextResponse } from 'next/server'

// Mock scans data
let scans: any[] = [
  {
    id: '1',
    name: 'Industrial Facility Scan',
    project_id: '1',
    status: 'completed',
    thumbnail: null,
    model_url: '/models/sample.ply',
    processing_options: {
      quality: 'high',
      meshing: true,
      dense_reconstruction: true
    },
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2', 
    name: 'Exterior Walkthrough',
    project_id: '1',
    status: 'processing',
    thumbnail: null,
    processing_options: {
      quality: 'medium',
      meshing: false,
      dense_reconstruction: true
    },
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'Interior Details',
    project_id: '1', 
    status: 'completed',
    thumbnail: null,
    model_url: '/models/sample.ply',
    processing_options: {
      quality: 'extreme',
      meshing: true,
      dense_reconstruction: true
    },
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectScans = scans.filter(scan => scan.project_id === params.id)
    
    return NextResponse.json({
      success: true,
      data: projectScans
    })
  } catch (error) {
    console.error('Error fetching scans:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch scans' },
      { status: 500 }
    )
  }
}
