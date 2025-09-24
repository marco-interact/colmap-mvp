'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stats, Html, useProgress } from '@react-three/drei'
import { Perf } from 'r3f-perf'
import { useControls } from 'leva'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Ruler, 
  Square, 
  Eye, 
  EyeOff,
  Settings,
  Download,
  Layers,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { useViewerStore } from '@/stores/useViewerStore'
import { PointCloudLoader } from '@/utils/loaders/loadPointCloud'
import { MeshLoader } from '@/utils/loaders/loadMesh'

interface ColmapViewerProps {
  projectId: string
  scanId: string
  onClose?: () => void
  className?: string
}

// Enhanced Point Cloud Loader with better progress tracking
function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div style={{ 
        color: 'white', 
        fontSize: '14px',
        background: 'rgba(0,0,0,0.8)',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        Loading COLMAP Point Cloud... {progress.toFixed(1)}%
        <div style={{
          width: '200px',
          height: '4px',
          background: '#333',
          borderRadius: '2px',
          marginTop: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'var(--brand-primary)',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    </Html>
  )
}

// Enhanced Point cloud component with better rendering
function PointCloudRenderer({ url, visible = true }: { url: string; visible?: boolean }) {
  const meshRef = useRef<THREE.Points>(null)
  const { setPointCloud, setLoadingProgress, setError, settings } = useViewerStore()
  const [isLoading, setIsLoading] = useState(true)

  // Use Leva controls for point cloud settings
  const pointCloudControls = useControls('Point Cloud', {
    size: { value: settings.pointSize, min: 0.1, max: 10, step: 0.1 },
    density: { value: settings.pointDensity, min: 0.1, max: 2, step: 0.1 },
    visible: visible
  })

  useEffect(() => {
    if (!url || !visible) return

    let cancelled = false
    setIsLoading(true)

    const loadPointCloud = async () => {
      try {
        const pointCloud = await PointCloudLoader.load(
          url,
          {
            pointSize: pointCloudControls.size,
            maxPoints: Math.floor(1000000 * pointCloudControls.density),
            useVertexColors: true
          },
          (progress) => {
            if (!cancelled) {
              setLoadingProgress(progress.percentage)
            }
          }
        )

        if (!cancelled && meshRef.current) {
          meshRef.current.geometry = pointCloud.geometry
          meshRef.current.material = pointCloud.material
          setPointCloud(pointCloud)
          setIsLoading(false)
        }
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : 'Failed to load point cloud')
          setIsLoading(false)
        }
      }
    }

    loadPointCloud()

    return () => {
      cancelled = true
    }
  }, [url, visible, pointCloudControls.size, pointCloudControls.density])

  // Update point size when controls change
  useEffect(() => {
    if (meshRef.current && meshRef.current.material instanceof THREE.PointsMaterial) {
      meshRef.current.material.size = pointCloudControls.size
      meshRef.current.material.needsUpdate = true
    }
  }, [pointCloudControls.size])

  if (!pointCloudControls.visible || !visible) return null
  if (isLoading) return <Loader />

  return (
    <points ref={meshRef}>
      <bufferGeometry />
      <pointsMaterial 
        size={pointCloudControls.size} 
        sizeAttenuation 
        vertexColors 
        transparent
        opacity={0.8}
      />
    </points>
  )
}

// Mesh component
function MeshRenderer({ url, visible = true }: { url: string; visible?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { setMesh, setLoadingProgress, setError } = useViewerStore()

  useEffect(() => {
    if (!url || !visible) return

    let cancelled = false

    const loadMesh = async () => {
      try {
        const mesh = await MeshLoader.load(
          url,
          {
            wireframe: false,
            opacity: 0.8,
            metalness: 0.1,
            roughness: 0.8,
            enableShadows: true,
            computeNormals: true
          },
          (progress) => {
            if (!cancelled) {
              setLoadingProgress(progress.percentage)
            }
          }
        )

        if (!cancelled && meshRef.current) {
          meshRef.current.geometry = mesh.geometry
          meshRef.current.material = mesh.material
          setMesh(mesh)
        }
      } catch (error) {
        if (!cancelled) {
          setError(error instanceof Error ? error.message : 'Failed to load mesh')
        }
      }
    }

    loadMesh()

    return () => {
      cancelled = true
    }
  }, [url, visible, setMesh, setLoadingProgress, setError])

  if (!visible) return null

  return (
    <mesh ref={meshRef}>
      <bufferGeometry />
      <meshStandardMaterial />
    </mesh>
  )
}

// Measurement visualization component
function MeasurementRenderer() {
  const { measurements, settings } = useViewerStore()

  if (!settings.showMeasurements) return null

  return (
    <group>
      {measurements.map((measurement) => (
        <group key={measurement.id}>
          {measurement.points.map((point, index) => (
            <mesh key={point.id} position={[point.position.x, point.position.y, point.position.z]}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshBasicMaterial color="red" />
            </mesh>
          ))}
          {measurement.type === 'distance' && measurement.points.length >= 2 && (
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  array={new Float32Array([
                    measurement.points[0].position.x,
                    measurement.points[0].position.y,
                    measurement.points[0].position.z,
                    measurement.points[1].position.x,
                    measurement.points[1].position.y,
                    measurement.points[1].position.z,
                  ])}
                  count={2}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="yellow" linewidth={2} />
            </line>
          )}
        </group>
      ))}
    </group>
  )
}

// Controls component
function ViewerControls({ onClose }: { onClose?: () => void }) {
  const {
    settings,
    updateSettings,
    measurementMode,
    startMeasurement,
    assets,
    isLoading,
    loadingProgress,
    error
  } = useViewerStore()
  
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-auto">
        <div className="flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2">
          <h3 className="text-white font-medium">COLMAP 3D Viewer</h3>
          {isLoading && (
            <div className="flex items-center gap-2 text-white/70">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-sm">{Math.round(loadingProgress)}%</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-black/80 backdrop-blur-sm rounded-lg text-white hover:bg-black/90 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-black/80 backdrop-blur-sm rounded-lg text-white hover:bg-black/90 transition-colors"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Left Sidebar Controls */}
      <div className="absolute left-4 top-20 bottom-4 w-80 bg-black/90 backdrop-blur-sm rounded-lg p-4 pointer-events-auto overflow-y-auto">
        <div className="space-y-6">
          {/* Layer Controls */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Layers size={16} />
              Layers
            </h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-white/80 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showSparseCloud}
                  onChange={(e) => updateSettings({ showSparseCloud: e.target.checked })}
                  className="rounded"
                />
                Sparse Point Cloud
              </label>
              <label className="flex items-center gap-2 text-white/80 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showDenseCloud}
                  onChange={(e) => updateSettings({ showDenseCloud: e.target.checked })}
                  className="rounded"
                />
                Dense Point Cloud
              </label>
              <label className="flex items-center gap-2 text-white/80 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showMesh}
                  onChange={(e) => updateSettings({ showMesh: e.target.checked })}
                  className="rounded"
                />
                Reconstructed Mesh
              </label>
              <label className="flex items-center gap-2 text-white/80 text-sm">
                <input
                  type="checkbox"
                  checked={settings.showTexture}
                  onChange={(e) => updateSettings({ showTexture: e.target.checked })}
                  className="rounded"
                />
                Texture Mapping
              </label>
            </div>
          </div>

          {/* Point Cloud Settings */}
          <div>
            <h4 className="text-white font-medium mb-3">Point Cloud Settings</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-white/80 text-sm mb-1">Point Size</label>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={settings.pointSize}
                  onChange={(e) => updateSettings({ pointSize: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <span className="text-white/60 text-xs">{settings.pointSize}px</span>
              </div>
              
              <div>
                <label className="block text-white/80 text-sm mb-1">Density</label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={settings.pointDensity}
                  onChange={(e) => updateSettings({ pointDensity: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <span className="text-white/60 text-xs">{Math.round(settings.pointDensity * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Measurement Tools */}
          <div>
            <h4 className="text-white font-medium mb-3">Measurement Tools</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => startMeasurement('distance')}
                className={`p-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  measurementMode === 'distance' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/20 text-white/80 hover:bg-white/30'
                }`}
              >
                <Ruler size={16} />
                Distance
              </button>
              <button
                onClick={() => startMeasurement('area')}
                className={`p-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  measurementMode === 'area' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/20 text-white/80 hover:bg-white/30'
                }`}
              >
                <Square size={16} />
                Area
              </button>
            </div>
          </div>

          {/* Camera Controls */}
          <div>
            <h4 className="text-white font-medium mb-3">Camera</h4>
            <div className="space-y-2">
              <button
                onClick={() => updateSettings({ autoRotate: !settings.autoRotate })}
                className="w-full p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white/80 text-sm transition-colors flex items-center justify-center gap-2"
              >
                {settings.autoRotate ? <Pause size={16} /> : <Play size={16} />}
                {settings.autoRotate ? 'Stop' : 'Auto'} Rotation
              </button>
              <button
                onClick={() => {
                  // Reset camera will be handled by OrbitControls ref
                  const event = new CustomEvent('resetCamera')
                  window.dispatchEvent(event)
                }}
                className="w-full p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white/80 text-sm transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Reset View
              </button>
            </div>
          </div>

          {/* Export Tools */}
          <div>
            <h4 className="text-white font-medium mb-3">Export</h4>
            <button
              className="w-full p-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-2"
              onClick={() => {
                // Download functionality would be implemented here
                console.log('Export model')
              }}
            >
              <Download size={16} />
              Download Model
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-4 right-4 bg-red-600/90 backdrop-blur-sm rounded-lg p-4 text-white max-w-sm pointer-events-auto">
          <h4 className="font-medium mb-1">Error</h4>
          <p className="text-sm opacity-90">{error}</p>
          <button
            onClick={() => useViewerStore.getState().setError(null)}
            className="mt-2 text-xs underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

// Main viewer scene
function ViewerScene({ assets }: { assets: any[] }) {
  const { settings, setCameraState } = useViewerStore()
  const controlsRef = useRef<any>(null)

  // Handle camera reset
  useEffect(() => {
    const handleReset = () => {
      if (controlsRef.current) {
        controlsRef.current.reset()
      }
    }

    window.addEventListener('resetCamera', handleReset)
    return () => window.removeEventListener('resetCamera', handleReset)
  }, [])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={100}
        autoRotate={settings.autoRotate}
        autoRotateSpeed={0.5}
        onEnd={(e: any) => {
          if (e?.target?.object && e?.target?.target) {
            setCameraState({
              position: [e.target.object.position.x, e.target.object.position.y, e.target.object.position.z],
              target: [e.target.target.x, e.target.target.y, e.target.target.z]
            })
          }
        }}
      />

      {/* Mock point cloud and mesh rendering */}
      {assets.length > 0 && (
        <>
          {settings.showSparseCloud && (
            <PointCloudRenderer url="/models/sample.ply" visible={settings.showSparseCloud} />
          )}
          {settings.showDenseCloud && (
            <PointCloudRenderer url="/models/sample.ply" visible={settings.showDenseCloud} />
          )}
          {settings.showMesh && (
            <MeshRenderer url="/models/sample.ply" visible={settings.showMesh} />
          )}
        </>
      )}

      {/* Measurements */}
      <MeasurementRenderer />

      {/* Performance stats */}
      {settings.showStats && <Stats />}
    </>
  )
}

export function ColmapViewer({ projectId, scanId, onClose, className = '' }: ColmapViewerProps) {
  const { assets, setAssets, settings, isLoading, error, reset } = useViewerStore()

  // Mock assets for demonstration
  const mockAssets = useMemo(() => [
    {
      id: 'sparse',
      type: 'sparse' as const,
      url: '/api/placeholder/sparse.ply',
      filename: 'sparse_cloud.ply',
      size: 1024000,
      status: 'available' as const
    },
    {
      id: 'dense',
      type: 'dense' as const,
      url: '/api/placeholder/dense.ply',
      filename: 'dense_cloud.ply', 
      size: 5120000,
      status: 'available' as const
    },
    {
      id: 'mesh',
      type: 'mesh' as const,
      url: '/api/placeholder/mesh.ply',
      filename: 'reconstructed_mesh.ply',
      size: 2048000,
      status: 'available' as const
    }
  ], [])

  useEffect(() => {
    setAssets(mockAssets)
    
    return () => {
      reset()
    }
  }, [setAssets, reset, mockAssets])

  return (
    <div className={`relative w-full h-full min-h-screen bg-gray-900 ${className}`}>
      <Canvas
        camera={{ 
          position: [10, 10, 10], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        style={{ background: settings.backgroundColor }}
        shadows
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <ViewerScene assets={assets} />
      </Canvas>
      
      <ViewerControls onClose={onClose} />
    </div>
  )
}
