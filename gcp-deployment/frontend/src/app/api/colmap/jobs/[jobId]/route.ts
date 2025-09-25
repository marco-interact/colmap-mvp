import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const colmapWorkerUrl = process.env.COLMAP_WORKER_URL || 'http://localhost:8001'
    
    const response = await fetch(`${colmapWorkerUrl}/jobs/${params.jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to get job status' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      job_id: params.jobId,
      status: data.status,
      progress: data.progress,
      message: data.message,
      results: data.results,
      created_at: data.created_at,
      updated_at: data.updated_at
    })

  } catch (error) {
    console.error('Error getting job status:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to connect to COLMAP service' },
      { status: 500 }
    )
  }
}
