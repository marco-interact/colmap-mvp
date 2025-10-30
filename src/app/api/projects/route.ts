import { NextRequest, NextResponse } from 'next/server'

// Backend URL - use environment variable or fallback
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET() {
  try {
    // Proxy request to backend
    const response = await fetch(`${BACKEND_URL}/api/projects`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`Backend error: ${response.status} ${response.statusText}`)
      // Return empty array if backend unavailable
      return NextResponse.json({ projects: [] })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch projects from backend:', error)
    // Return empty array if backend unavailable
    return NextResponse.json({ projects: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Proxy request to backend
    const backendData = new URLSearchParams({
      user_email: data.user_email || 'demo@colmap.app',
      name: data.name,
      description: data.description || '',
      location: data.location || '',
      space_type: data.space_type || '',
      project_type: data.project_type || '',
    })
    
    const response = await fetch(`${BACKEND_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: backendData,
    })

    if (!response.ok) {
      console.error(`Backend error: ${response.status} ${response.statusText}`)
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 })
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to create project:', error)
    return NextResponse.json({ error: 'Network error' }, { status: 500 })
  }
}