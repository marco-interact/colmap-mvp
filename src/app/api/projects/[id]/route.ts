import { NextRequest, NextResponse } from 'next/server'

// Mock projects data - same as in projects/route.ts
const projects = [
  {
    id: '1',
    name: 'ITECSA Nave Industrial',
    description: 'Render de sitio de obra para Desarrollo Industrial',
    location: 'Playa del Carmen',
    user_id: '1',
    status: 'completed',
    settings: {
      space_type: 'industrial',
      project_type: 'reconstruction',
      quality: 'medium'
    },
    thumbnail: '/api/assets/sample-industrial.jpg',
    total_scans: 1,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    last_processed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2', 
    name: 'Casa Residencial Moderna',
    description: 'Escaneo 3D completo para documentación arquitectónica',
    location: 'Cancún, Quintana Roo',
    user_id: '1',
    status: 'processing',
    settings: {
      space_type: 'residential',
      project_type: 'documentation',
      quality: 'high'
    },
    total_scans: 0,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = projects.find(p => p.id === params.id)
    
    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: project
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectIndex = projects.findIndex(p => p.id === params.id)
    
    if (projectIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      )
    }

    // Remove project from array
    projects.splice(projectIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
