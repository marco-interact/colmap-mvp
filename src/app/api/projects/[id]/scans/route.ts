import { NextRequest, NextResponse } from 'next/server'

// Mock scans data
let scans: any[] = [
  {
    id: '1',
    name: 'Scan 1',
    project_id: '1',
    status: 'completed',
    thumbnail: null,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
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
