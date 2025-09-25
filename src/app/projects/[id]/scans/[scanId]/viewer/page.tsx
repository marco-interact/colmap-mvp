'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Settings, RotateCcw } from 'lucide-react'
import { Scan } from '@/types'
import { Sidebar } from '@/components/layout/sidebar'
import { ModelViewer } from '@/components/3d/model-viewer'
import { Button } from '@/components/ui/button'

interface ViewerPageProps {
  params: {
    id: string
    scanId: string
  }
}

export default function ViewerPage({ params }: ViewerPageProps) {
  const [scan, setScan] = useState<Scan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewerSettings, setViewerSettings] = useState({
    showWireframe: false,
    showStats: true,
    autoRotate: false
  })
  const router = useRouter()

  useEffect(() => {
    fetchScanDetails()
  }, [params.scanId])

  const fetchScanDetails = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/scans/${params.scanId}`)
      const data = await response.json()
      setScan(data.data)
    } catch (error) {
      console.error('Failed to fetch scan:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    // Implement download functionality
    console.log('Download scan data')
  }

  const handleResetView = () => {
    // Reset camera position
    console.log('Reset camera view')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 font-mono">Loading 3D viewer...</p>
        </div>
      </div>
    )
  }

  if (!scan) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-mono font-bold text-white mb-4">Scan not found</h1>
          <Button onClick={() => router.push(`/projects/${params.id}`)}>
            Back to Project
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
        <div className="h-screen flex flex-col">
          {/* Header */}
          <motion.div 
            className="flex justify-between items-center p-6 bg-gray-800 border-b border-gray-600"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push(`/projects/${params.id}`)}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Project
              </Button>
              <div>
                <h1 className="text-2xl font-mono font-bold text-white">
                  {scan.name} - 3D Viewer
                </h1>
                <p className="text-gray-400 font-mono text-sm">
                  Interactive 3D model viewer
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleResetView}
                className="text-gray-400 hover:text-white border-gray-600"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset View
              </Button>
              <Button
                variant="outline"
                onClick={() => setViewerSettings(prev => ({ ...prev, showStats: !prev.showStats }))}
                className="text-gray-400 hover:text-white border-gray-600"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                onClick={handleDownload}
                className="bg-green-500 hover:bg-green-600 text-white font-mono font-bold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </motion.div>

          {/* 3D Viewer */}
          <div className="flex-1 p-6">
            <motion.div
              className="w-full h-full bg-gray-800 rounded-lg overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ModelViewer 
                modelUrl={scan.models?.point_cloud_url}
                className="w-full h-full"
              />
            </motion.div>
          </div>

          {/* Viewer Controls */}
          <motion.div 
            className="p-6 bg-gray-800 border-t border-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="wireframe"
                    checked={viewerSettings.showWireframe}
                    onChange={(e) => setViewerSettings(prev => ({ ...prev, showWireframe: e.target.checked }))}
                    className="w-4 h-4 text-green-500 bg-gray-600 border-gray-500 rounded focus:ring-green-500"
                  />
                  <label htmlFor="wireframe" className="text-white font-mono text-sm">
                    Wireframe
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoRotate"
                    checked={viewerSettings.autoRotate}
                    onChange={(e) => setViewerSettings(prev => ({ ...prev, autoRotate: e.target.checked }))}
                    className="w-4 h-4 text-green-500 bg-gray-600 border-gray-500 rounded focus:ring-green-500"
                  />
                  <label htmlFor="autoRotate" className="text-white font-mono text-sm">
                    Auto Rotate
                  </label>
                </div>
              </div>
              <div className="text-gray-400 font-mono text-sm">
                Use mouse to rotate, scroll to zoom, right-click to pan
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}