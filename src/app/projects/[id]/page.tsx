'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Trash2, Plus, MapPin, Calendar } from 'lucide-react'
import { Project, Scan } from '@/types'
import { Sidebar } from '@/components/layout/sidebar'
import { ScanModal } from '@/components/forms/scan-modal'
import { Button } from '@/components/ui/button'

interface ProjectDetailsPageProps {
  params: {
    id: string
  }
}

export default function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showScanModal, setShowScanModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchProjectDetails()
  }, [params.id])

  const fetchProjectDetails = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      const data = await response.json()
      setProject(data.data)
      setScans(data.data?.scans || [])
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateScan = async (scanData: any) => {
    try {
      const response = await fetch(`/api/projects/${params.id}/scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scanData)
      })

      if (response.ok) {
        await fetchProjectDetails()
        setShowScanModal(false)
      }
    } catch (error) {
      console.error('Failed to create scan:', error)
    }
  }

  const handleScanClick = (scanId: string) => {
    router.push(`/projects/${params.id}/scans/${scanId}/viewer`)
  }

  const handleDeleteProject = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      try {
        const response = await fetch(`/api/projects/${params.id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to delete project:', error)
      }
    }
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

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-mono font-bold text-white mb-4">Project not found</h1>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <Sidebar activeItem="projects" />

      {/* Main Content */}
      <div className="flex-1 bg-gray-700">
        <div className="p-8">
          {/* Header */}
          <motion.div 
            className="flex justify-between items-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-mono font-bold text-white">
                  {project.name} > Scans
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleDeleteProject}
                className="text-gray-400 hover:text-white border-gray-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                ELIMINAR PROYECTO
              </Button>
              <Button
                onClick={() => setShowScanModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-mono font-bold px-6 py-2 rounded-lg transition-colors duration-200 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                + NEW SCAN
              </Button>
            </div>
          </motion.div>

          {/* Scans Grid */}
          {scans.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2 font-mono">No scans yet</h3>
              <p className="text-gray-400 mb-6 font-mono">Create your first scan to start 3D reconstruction</p>
              <Button
                onClick={() => setShowScanModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-mono font-bold px-6 py-3 rounded-lg transition-colors duration-200"
              >
                Create Your First Scan
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {scans.map((scan, index) => (
                <motion.div
                  key={scan.id}
                  className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-750 transition-colors duration-200"
                  onClick={() => handleScanClick(scan.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Scan Preview */}
                  <div className="w-full h-48 bg-gray-600 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                    <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 opacity-50"></div>
                  </div>

                  {/* Scan Info */}
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-400 text-sm font-mono">
                      <Calendar className="w-4 h-4 mr-2" />
                      Actualizado: {new Date(scan.updated_at).toLocaleDateString('es-ES')}
                    </div>

                    <h3 className="text-lg font-bold text-white font-mono">
                      {scan.name}
                    </h3>

                    {scan.description && (
                      <p className="text-gray-400 text-sm font-mono line-clamp-2">
                        {scan.description}
                      </p>
                    )}

                    {scan.location && (
                      <div className="flex items-center text-gray-400 text-sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        {scan.location}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Scan Modal */}
      <ScanModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        onSubmit={handleCreateScan}
        projectId={params.id}
      />
    </div>
  )
}