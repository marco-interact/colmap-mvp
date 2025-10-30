import { NextRequest, NextResponse } from 'next/server'

// Backend URL - use environment variable or fallback
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Proxy request to backend
    const response = await fetch(`${BACKEND_URL}/api/projects/${params.id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`Backend error: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch project from backend:', error)
    return NextResponse.json(
      { error: 'Network error' },
      { status: 500 }
    )
  }
}


