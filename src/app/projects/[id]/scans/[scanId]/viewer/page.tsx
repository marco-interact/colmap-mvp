'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function ViewerPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  useEffect(() => {
    // Simulate loading 3D model
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 font-mono">Loading 3D model...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-mono font-bold text-green-500 mb-8">Colmap App</h2>
          
          {/* User Profile */}
          <div className="flex items-center mb-8">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-mono text-sm">CM</span>
            </div>
            <span className="text-white font-mono text-sm">Carlos Martinez</span>
          </div>
          
          {/* Navigation */}
          <nav className="space-y-2">
            <a href="/dashboard" className="flex items-center px-4 py-3 text-gray-400 hover:text-white transition-colors font-mono text-sm">
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              Mis Proyectos
            </a>
            <a href="/dashboard/recent" className="flex items-center px-4 py-3 text-gray-400 hover:text-white transition-colors font-mono text-sm">
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recientes
            </a>
            <a href="/dashboard/settings" className="flex items-center px-4 py-3 text-gray-400 hover:text-white transition-colors font-mono text-sm">
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuración
            </a>
            <a href="/help" className="flex items-center px-4 py-3 text-gray-400 hover:text-white transition-colors font-mono text-sm">
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ayuda
            </a>
          </nav>
        </div>
        
        {/* Footer */}
        <div className="mt-auto p-6">
          <p className="text-gray-500 text-xs font-mono">Demo Version</p>
        </div>
      </div>

      {/* Main Content - 3D Viewer */}
      <div className="flex-1 bg-gray-700 relative">
        {/* 3D Canvas */}
        <div className="absolute inset-0">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)' }}
          />
          
          {/* 3D Model Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white font-mono mb-2">3D Model Viewer</h3>
              <p className="text-gray-400 font-mono">Point cloud and mesh visualization</p>
            </div>
          </div>
        </div>

        {/* Viewer Controls */}
        <div className="absolute top-4 right-4 bg-gray-800 rounded-lg p-4 shadow-lg">
          <h4 className="text-white font-mono text-sm font-bold mb-3">Viewer Controls</h4>
          <div className="space-y-2">
            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-mono text-xs px-3 py-2 rounded transition-colors duration-200">
              Point Cloud
            </button>
            <button className="w-full bg-gray-600 hover:bg-gray-500 text-white font-mono text-xs px-3 py-2 rounded transition-colors duration-200">
              Mesh
            </button>
            <button className="w-full bg-gray-600 hover:bg-gray-500 text-white font-mono text-xs px-3 py-2 rounded transition-colors duration-200">
              Texture
            </button>
          </div>
        </div>

        {/* Measurement Tools */}
        <div className="absolute bottom-4 left-4 bg-gray-800 rounded-lg p-4 shadow-lg">
          <h4 className="text-white font-mono text-sm font-bold mb-3">Measurements</h4>
          <div className="space-y-2">
            <button className="w-full bg-gray-600 hover:bg-gray-500 text-white font-mono text-xs px-3 py-2 rounded transition-colors duration-200">
              Distance
            </button>
            <button className="w-full bg-gray-600 hover:bg-gray-500 text-white font-mono text-xs px-3 py-2 rounded transition-colors duration-200">
              Area
            </button>
            <button className="w-full bg-gray-600 hover:bg-gray-500 text-white font-mono text-xs px-3 py-2 rounded transition-colors duration-200">
              Volume
            </button>
          </div>
        </div>

        {/* Export Options */}
        <div className="absolute bottom-4 right-4 bg-gray-800 rounded-lg p-4 shadow-lg">
          <h4 className="text-white font-mono text-sm font-bold mb-3">Export</h4>
          <div className="space-y-2">
            <button className="w-full bg-gray-600 hover:bg-gray-500 text-white font-mono text-xs px-3 py-2 rounded transition-colors duration-200">
              Download PLY
            </button>
            <button className="w-full bg-gray-600 hover:bg-gray-500 text-white font-mono text-xs px-3 py-2 rounded transition-colors duration-200">
              Download OBJ
            </button>
            <button className="w-full bg-gray-600 hover:bg-gray-500 text-white font-mono text-xs px-3 py-2 rounded transition-colors duration-200">
              Download GLB
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
