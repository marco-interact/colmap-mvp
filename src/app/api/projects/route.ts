import { NextRequest, NextResponse } from 'next/server'

// Mock data
const mockProjects = [
  {
    id: '1',
    name: 'Demo Project',
    description: 'A sample 3D reconstruction project',
    location: 'San Francisco, CA',
    space_type: 'indoor',
    project_type: 'architecture',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    user_id: 'user-1',
    scans: [
      {
        id: 'scan-1',
        name: 'Demo Scan',
        project_id: '1',
        status: 'completed',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T11:00:00Z',
        model_url: '/models/sample.ply',
        thumbnail_url: '/api/assets/sample-scan-thumbnail.jpg'
      }
    ]
  }
]

export async function GET() {
  return NextResponse.json({
    success: true,
    data: mockProjects
  })
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const newProject = {
      id: `project-${Date.now()}`,
      name: data.name,
      description: data.description || '',
      location: data.location || '',
      space_type: data.space_type || '',
      project_type: data.project_type || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-1',
      scans: []
    }
    
    return NextResponse.json({
      success: true,
      data: newProject
    })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}