"use client"

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass'
import { 
  Palette, 
  Download, 
  Camera, 
  Settings, 
  BarChart3, 
  Target,
  Zap,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Maximize2,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import open3dApi, { PointCloudStats } from '@/lib/open3d-api'

interface ThreeJSViewerProps {
  modelUrl: string
  pointCloudUrl?: string
  scanId: string
  onStatsUpdate?: (stats: PointCloudStats) => void
  onImageGenerated?: (imageUrl: string) => void
  onMeshGenerated?: (meshUrl: string) => void
  className?: string
}

export function ThreeJSViewer({
  modelUrl,
  pointCloudUrl,
  scanId,
  onStatsUpdate,
  onImageGenerated,
  onMeshGenerated,
  className = ""
}: ThreeJSViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const controlsRef = useRef<OrbitControls>()
  const composerRef = useRef<EffectComposer>()
  const animationIdRef = useRef<number>()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<PointCloudStats | null>(null)
  const [viewMode, setViewMode] = useState<'pointcloud' | 'mesh'>('pointcloud')
  const [wireframe, setWireframe] = useState(false)
  const [showNormals, setShowNormals] = useState(false)
  const [colormap, setColormap] = useState<string>('default')
  const [pointSize, setPointSize] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!mountRef.current) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(5, 5, 5)
    cameraRef.current = camera

    // Renderer with WebGL optimization
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      precision: "highp"
    })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    rendererRef.current = renderer
    mountRef.current.appendChild(renderer.domElement)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = true
    controls.enablePan = true
    controls.enableRotate = true
    controlsRef.current = controls

    // Post-processing effects
    const composer = new EffectComposer(renderer)
    composerRef.current = composer

    // Render pass
    const renderPass = new RenderPass(scene, camera)
    composer.addPass(renderPass)

    // Bloom effect for enhanced visualization
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(mountRef.current.clientWidth, mountRef.current.clientHeight),
      1.5,  // strength
      0.4,  // radius
      0.85  // threshold
    )
    composer.addPass(bloomPass)

    // SSAO for better depth perception
    const ssaoPass = new SSAOPass(
      scene,
      camera,
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    )
    ssaoPass.kernelRadius = 16
    ssaoPass.minDistance = 0.005
    ssaoPass.maxDistance = 0.1
    composer.addPass(ssaoPass)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      
      controls.update()
      composer.render()
    }
    animate()

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return
      
      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight
      
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      composer.setSize(width, height)
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [])

  // Load 3D model
  const loadModel = useCallback(async () => {
    if (!sceneRef.current) return

    setLoading(true)
    setError(null)

    try {
      // Clear existing models
      const scene = sceneRef.current
      const objectsToRemove = scene.children.filter(child => 
        child.userData.isModel || child.userData.isPointCloud
      )
      objectsToRemove.forEach(obj => scene.remove(obj))

      // Determine which model to load
      const url = viewMode === 'pointcloud' ? (pointCloudUrl || modelUrl) : modelUrl
      
      if (viewMode === 'pointcloud' || url.endsWith('.ply')) {
        await loadPointCloud(url)
      } else if (url.endsWith('.gltf') || url.endsWith('.glb')) {
        await loadGLTF(url)
      } else if (url.endsWith('.obj')) {
        await loadOBJ(url)
      } else {
        throw new Error('Unsupported file format')
      }

      // Load point cloud statistics
      if (viewMode === 'pointcloud') {
        const stats = await open3dApi.getPointCloudStats(scanId)
        setStats(stats)
        onStatsUpdate?.(stats)
      }

    } catch (err) {
      setError(`Failed to load model: ${err.message}`)
      console.error('Model loading error:', err)
    } finally {
      setLoading(false)
    }
  }, [modelUrl, pointCloudUrl, scanId, viewMode, onStatsUpdate])

  // Load point cloud
  const loadPointCloud = async (url: string) => {
    const loader = new PLYLoader()
    const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject)
    })

    // Create point cloud material
    const material = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: geometry.hasAttribute('color'),
      sizeAttenuation: true
    })

    // Apply colormap if needed
    if (colormap !== 'default' && geometry.hasAttribute('color')) {
      const colors = geometry.getAttribute('color')
      const newColors = new Float32Array(colors.count * 3)
      
      for (let i = 0; i < colors.count; i++) {
        const color = new THREE.Color()
        color.setHSL(i / colors.count, 0.8, 0.6)
        newColors[i * 3] = color.r
        newColors[i * 3 + 1] = color.g
        newColors[i * 3 + 2] = color.b
      }
      
      geometry.setAttribute('color', new THREE.BufferAttribute(newColors, 3))
    }

    const points = new THREE.Points(geometry, material)
    points.userData.isPointCloud = true
    sceneRef.current?.add(points)

    // Center and scale
    geometry.computeBoundingBox()
    const box = geometry.boundingBox!
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 2 / maxDim
    
    points.position.copy(center).multiplyScalar(-1)
    points.scale.setScalar(scale)
  }

  // Load GLTF model
  const loadGLTF = async (url: string) => {
    const loader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    loader.setDRACOLoader(dracoLoader)

    const gltf = await new Promise<any>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject)
    })

    const model = gltf.scene
    model.userData.isModel = true
    sceneRef.current?.add(model)

    // Center and scale
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 2 / maxDim

    model.position.copy(center).multiplyScalar(-1)
    model.scale.setScalar(scale)

    // Apply wireframe if enabled
    if (wireframe) {
      model.traverse((child: any) => {
        if (child.isMesh) {
          child.material.wireframe = true
        }
      })
    }
  }

  // Load OBJ model
  const loadOBJ = async (url: string) => {
    const loader = new OBJLoader()
    const object = await new Promise<THREE.Group>((resolve, reject) => {
      loader.load(url, resolve, undefined, reject)
    })

    object.userData.isModel = true
    sceneRef.current?.add(object)

    // Center and scale
    const box = new THREE.Box3().setFromObject(object)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 2 / maxDim

    object.position.copy(center).multiplyScalar(-1)
    object.scale.setScalar(scale)
  }

  // Apply colormap
  const applyColormap = async (colormapType: string) => {
    try {
      setLoading(true)
      const result = await open3dApi.applyColormap(scanId, { type: colormapType })
      if (result.success) {
        setColormap(colormapType)
        await loadModel() // Reload model with new colormap
      }
    } catch (err) {
      setError('Failed to apply colormap')
      console.error('Colormap error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Render high-resolution image
  const renderHighResImage = async () => {
    try {
      setLoading(true)
      const result = await open3dApi.renderToImage(scanId, { 
        width: 1920, 
        height: 1080 
      })
      if (result.success && result.imageUrl) {
        onImageGenerated?.(result.imageUrl)
      }
    } catch (err) {
      setError('Failed to render image')
      console.error('Render error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mountRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }

  // Reset camera
  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(5, 5, 5)
      controlsRef.current.reset()
    }
  }

  // Initialize scene on mount
  useEffect(() => {
    const cleanup = initScene()
    return cleanup
  }, [initScene])

  // Load model when props change
  useEffect(() => {
    loadModel()
  }, [loadModel])

  return (
    <div className={`relative ${className}`}>
      {/* 3D Viewer Container */}
      <div 
        ref={mountRef} 
        className="w-full h-full bg-black rounded-lg overflow-hidden"
        style={{ minHeight: '600px' }}
      />
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading 3D model...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg z-10">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        {/* View Mode Toggle */}
        <div className="flex space-x-1 bg-gray-800/80 rounded-lg p-1">
          <Button
            variant={viewMode === 'pointcloud' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('pointcloud')}
          >
            <Target className="w-4 h-4 mr-1" />
            Point Cloud
          </Button>
          <Button
            variant={viewMode === 'mesh' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('mesh')}
          >
            <Settings className="w-4 h-4 mr-1" />
            Mesh
          </Button>
        </div>

        {/* Colormap Controls */}
        {viewMode === 'pointcloud' && (
          <div className="flex space-x-1 bg-gray-800/80 rounded-lg p-1">
            {['jet', 'viridis', 'plasma', 'inferno'].map((type) => (
              <Button
                key={type}
                variant={colormap === type ? 'default' : 'ghost'}
                size="sm"
                onClick={() => applyColormap(type)}
                disabled={loading}
              >
                {type}
              </Button>
            ))}
          </div>
        )}

        {/* View Controls */}
        <div className="flex space-x-1 bg-gray-800/80 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetCamera}
            title="Reset Camera"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={renderHighResImage}
            disabled={loading}
            title="Render High-Res Image"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overlay */}
      {stats && (
        <div className="absolute bottom-4 left-4 bg-gray-800/80 text-white p-3 rounded-lg z-10">
          <div className="text-sm space-y-1">
            <div>Points: {stats.pointCount.toLocaleString()}</div>
            <div>Density: {stats.density.toFixed(2)} pts/m³</div>
            <div>Dimensions: {stats.dimensions.map(d => d.toFixed(2)).join(' × ')}m</div>
          </div>
        </div>
      )}
    </div>
  )
}
