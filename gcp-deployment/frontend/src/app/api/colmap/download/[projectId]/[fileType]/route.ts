import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; fileType: string } }
) {
  try {
    const colmapWorkerUrl = process.env.COLMAP_WORKER_URL || 'http://localhost:8001'
    
    const response = await fetch(
      `${colmapWorkerUrl}/download/${params.projectId}/${params.fileType}`,
      {
        method: 'GET',
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'File not found' },
        { status: 404 }
      )
    }

    // Stream the file from COLMAP worker to client
    const fileBuffer = await response.arrayBuffer()
    const filename = `${params.projectId}_${params.fileType}.ply`

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to download file' },
      { status: 500 }
    )
  }
}
