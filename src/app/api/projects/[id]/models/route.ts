import { NextRequest, NextResponse } from 'next/server'

// Mock COLMAP model assets for development
const mockModels = {
  sparse: {
    id: 'sparse_cloud',
    type: 'sparse',
    url: '/models/sample_sparse.ply',
    filename: 'sparse_reconstruction.ply',
    size: 1024000,
    status: 'available',
    created_at: new Date().toISOString(),
    metadata: {
      points: 15420,
      cameras: 48,
      features: 892340,
      matches: 156789
    }
  },
  dense: {
    id: 'dense_cloud',
    type: 'dense',
    url: '/models/sample_dense.ply',
    filename: 'dense_reconstruction.ply',
    size: 8192000,
    status: 'available',
    created_at: new Date().toISOString(),
    metadata: {
      points: 2847650,
      density: 'high',
      processing_time: '12m 34s'
    }
  },
  mesh: {
    id: 'textured_mesh',
    type: 'mesh',
    url: '/models/sample_mesh.ply',
    filename: 'textured_mesh.ply',
    size: 4096000,
    status: 'available',
    created_at: new Date().toISOString(),
    metadata: {
      vertices: 425680,
      faces: 851360,
      textures: ['diffuse', 'normal'],
      texture_resolution: '2048x2048'
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: projectId } = params
    
    // In a real implementation, fetch from database
    // const models = await getProjectModels(projectId)
    
    // For now, return mock data
    const models = Object.values(mockModels)
    
    return NextResponse.json({
      success: true,
      data: models,
      project_id: projectId,
      total_size: models.reduce((sum, model) => sum + model.size, 0),
      metadata: {
        reconstruction_date: new Date().toISOString(),
        colmap_version: '3.12.6',
        processing_options: {
          feature_extractor: 'SIFT',
          matcher: 'exhaustive',
          sparse_reconstruction: 'incremental',
          dense_reconstruction: 'patch_match',
          meshing: 'poisson'
        }
      }
    })
  } catch (error) {
    console.error('Error fetching project models:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch project models',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
