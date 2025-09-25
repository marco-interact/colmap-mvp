import { NextRequest, NextResponse } from 'next/server'
import { getScansByProject } from '@/lib/mockData'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectScans = getScansByProject(params.id)
    
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
