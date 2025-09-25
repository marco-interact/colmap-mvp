'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Project, Scan } from '@/types'
import { ScanModal } from '@/components/forms/scan-modal'

export function ProjectDetailClient() {
  const [project, setProject] = useState<Project | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showScanModal, setShowScanModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchProject()
    fetchScans()
  }, [])

  const fetchProject = async () => {
    try {
      const response = await fetch('/api/projects/1')
      const data = await response.json()
      setProject(data.data)
    } catch (error) {
      console.error('Failed to fetch project:', error)
    }
  }

  const fetchScans = async () => {
    try {
      const response = await fetch('/api/projects/1/scans')
      const data = await response.json()
      setScans(data.data || [])
    } catch (error) {
      console.error('Failed to fetch scans:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateScan = async (scanData: any) => {
    try {
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanData)
      })
      
      if (response.ok) {
        await fetchScans()
        setShowScanModal(false)
        // Navigate to 3D viewer
        router.push(`/projects/1/scans/1/viewer`)
      }
    } catch (error) {
      console.error('Failed to create scan:', error)
    }
  }

  const handleScanClick = (scanId: string) => {
    router.push(`/projects/1/scans/${scanId}/viewer`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 font-mono">Loading project...</p>
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
            <a href="/dashboard" className="flex items-center px-4 py-3 bg-green-500 text-white rounded-lg font-mono text-sm">
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

      {/* Main Content */}
      <div className="flex-1 bg-gray-700">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-mono font-bold text-white">
                {project?.name} > Scans
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-gray-600 hover:bg-gray-500 text-white font-mono font-bold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                ELIMINAR PROYECTO
              </button>
              <button
                onClick={() => setShowScanModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-mono font-bold px-6 py-2 rounded-lg transition-colors duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                + NEW SCAN
              </button>
            </div>
          </div>

          {/* Scans Grid */}
          {scans.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2 font-mono">No scans yet</h3>
              <p className="text-gray-400 mb-6 font-mono">Create your first scan to start 3D reconstruction</p>
              <button
                onClick={() => setShowScanModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-mono font-bold px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Create Your First Scan
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-750 transition-colors duration-200"
                  onClick={() => handleScanClick(scan.id)}
                >
                  {/* 3D Model Preview */}
                  <div className="w-full h-48 bg-gray-600 rounded-lg mb-4 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Scan Info */}
                  <div className="space-y-3">
                    <div className="text-gray-400 text-sm font-mono">
                      Actualizado: {new Date(scan.updated_at).toLocaleDateString('es-ES')}
                    </div>
                    
                    <h3 className="text-lg font-bold text-white font-mono">{project?.name}</h3>
                    
                    <h4 className="text-xl font-bold text-white font-mono">{scan.name}</h4>
                    
                    {project?.location && (
                      <div className="flex items-center text-gray-400 text-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {project.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scan Modal */}
      {showScanModal && (
        <ScanModal
          onClose={() => setShowScanModal(false)}
          onSubmit={handleCreateScan}
          projectId="1"
        />
      )}
    </div>
  )
}
