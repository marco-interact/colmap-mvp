import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Mock database - simplified to one functional project
let projects: any[] = [
  {
    id: '1',
    name: 'Demo Project',
    description: 'Sample project for testing COLMAP 3D reconstruction',
    location: 'San Francisco, CA',
    user_id: '1',
    status: 'active',
    settings: {
      space_type: 'industrial',
      project_type: 'reconstruction',
      quality: 'high'
    },
    thumbnail: '/api/assets/sample-industrial.jpg',
    total_scans: 1,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    last_processed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }
]

const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000),
  location: z.string().min(1, 'Location is required'),
  space_type: z.enum(['interior', 'exterior', 'industrial', 'residential', 'commercial']),
  project_type: z.enum(['reconstruction', 'measurement', 'inspection', 'modeling', 'documentation']),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    // Filter projects by search term
    let filteredProjects = projects
    if (search) {
      filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.description.toLowerCase().includes(search.toLowerCase()) ||
        project.location.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: paginatedProjects,
      pagination: {
        page,
        limit,
        total: filteredProjects.length,
        pages: Math.ceil(filteredProjects.length / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = createProjectSchema.parse(body)
    
    // Create new project
    const newProject = {
      id: (projects.length + 1).toString(),
      ...validatedData,
      user_id: '1', // TODO: Get from auth session
      status: 'created',
      settings: {
        space_type: validatedData.space_type,
        project_type: validatedData.project_type,
        quality: 'medium' as const
      },
      total_scans: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    projects.push(newProject)
    
    return NextResponse.json({
      success: true,
      data: newProject,
      message: 'Project created successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed',
          errors: error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }
    
    console.error('Error creating project:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create project' },
      { status: 500 }
    )
  }
}
