import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check - you can add more sophisticated checks here
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'colmap-frontend',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    }

    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      }, 
      { status: 503 }
    )
  }
}

export async function HEAD() {
  // Simple HEAD request for basic health checks
  return new NextResponse(null, { status: 200 })
}
