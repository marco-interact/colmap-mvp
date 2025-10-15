"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Environment, useGLTF, Html, Text } from "@react-three/drei"
import { PLYLoader } from "three-stdlib"
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Download, 
  Settings,
  Eye,
  EyeOff,
  Ruler,
  Volume,
  Square
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import * as THREE from "three"

interface ModelViewerProps {
  modelUrl?: string
  pointCloudUrl?: string
  className?: string
  showControls?: boolean
  autoRotate?: boolean
}

interface MeasurementPoint {
  position: THREE.Vector3
  id: string
}

// PLY Point Cloud Loader Component
function PLYModel({ url }: { url: string }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return

    setLoading(true)
    setError(null)

    const loader = new PLYLoader()
    loader.load(
      url,
      (geometry) => {
        geometry.computeVertexNormals()
        setGeometry(geometry)
        setLoading(false)
        console.log('✅ PLY file loaded successfully:', {
          vertices: geometry.attributes.position?.count,
          hasColors: !!geometry.attributes.color
        })
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100
        console.log(`Loading PLY: ${percent.toFixed(1)}%`)
      },
      (error) => {
        console.error('❌ Error loading PLY file:', error)
        setError('Failed to load 3D model')
        setLoading(false)
      }
    )
  }, [url])

  if (loading) {
    return (
      <Html center>
        <div className="text-white text-sm">Loading 3D model...</div>
      </Html>
    )
  }

  if (error || !geometry) {
    return (
      <Html center>
        <div className="text-red-400 text-sm">{error || 'Model not available'}</div>
      </Html>
    )
  }

  return (
    <points>
      <bufferGeometry attach="geometry" {...geometry} />
      <pointsMaterial
        size={0.01}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.8}
      />
    </points>
  )
}

interface ViewerControlsProps {
  onReset: () => void
  onToggleWireframe: () => void
  onTogglePointCloud: () => void
  onToggleMeasurement: () => void
  onDownload: () => void
  wireframe: boolean
  showPointCloud: boolean
  measurementMode: boolean
  isFullscreen: boolean
  onToggleFullscreen: () => void
}

function ViewerControls({
  onReset,
  onToggleWireframe,
  onTogglePointCloud,
  onToggleMeasurement,
  onDownload,
  wireframe,
  showPointCloud,
  measurementMode,
  isFullscreen,
  onToggleFullscreen
}: ViewerControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-10">
      <Card className="p-2 bg-gray-900/90 backdrop-blur-sm border-gray-700">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            title="Restablecer vista"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          <Button
            variant={wireframe ? "default" : "ghost"}
            size="sm"
            onClick={onToggleWireframe}
            title="Toggle wireframe"
          >
            <Square className="w-4 h-4" />
          </Button>
          
          <Button
            variant={showPointCloud ? "default" : "ghost"}
            size="sm"
            onClick={onTogglePointCloud}
            title="Toggle point cloud"
          >
            {showPointCloud ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          
          <Button
            variant={measurementMode ? "default" : "ghost"}
            size="sm"
            onClick={onToggleMeasurement}
            title="Herramienta de medición"
          >
            <Ruler className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            title="Descargar modelo"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}

function Model({ url, wireframe }: { url: string; wireframe: boolean }) {
  const { scene } = useGLTF(url)
  const meshRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.wireframe = wireframe
                }
              })
            } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
              mesh.material.wireframe = wireframe
            }
          }
        }
      })
    }
  }, [wireframe])

  return <primitive ref={meshRef} object={scene} />
}

function PointCloud({ points, visible }: { points: Float32Array; visible: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(points, 3))
  
  const material = new THREE.PointsMaterial({
    color: 0x88ccee,
    size: 0.01,
    sizeAttenuation: true
  })

  return visible ? (
    <points ref={pointsRef} geometry={geometry} material={material} />
  ) : null
}

function CameraController({ onReset }: { onReset: boolean }) {
  const { camera, gl } = useThree()
  const controlsRef = useRef<any>()

  useEffect(() => {
    if (onReset && controlsRef.current) {
      controlsRef.current.reset()
    }
  }, [onReset])

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enableDamping={true}
      dampingFactor={0.05}
      screenSpacePanning={false}
      minDistance={1}
      maxDistance={100}
      maxPolarAngle={Math.PI}
    />
  )
}

function MeasurementTool({ 
  enabled, 
  points, 
  onAddPoint 
}: { 
  enabled: boolean
  points: MeasurementPoint[]
  onAddPoint: (point: THREE.Vector3) => void 
}) {
  const { camera, raycaster, scene } = useThree()
  
  const handleClick = useCallback((event: MouseEvent) => {
    if (!enabled) return
    
    const canvas = event.target as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    const mouse = new THREE.Vector2(x, y)
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(scene.children, true)
    
    if (intersects.length > 0) {
      onAddPoint(intersects[0].point)
    }
  }, [enabled, camera, raycaster, scene, onAddPoint])

  useEffect(() => {
    const canvas = document.querySelector('canvas')
    if (canvas && enabled) {
      canvas.addEventListener('click', handleClick)
      canvas.style.cursor = 'crosshair'
    }
    
    return () => {
      if (canvas) {
        canvas.removeEventListener('click', handleClick)
        canvas.style.cursor = 'default'
      }
    }
  }, [enabled, handleClick])

  return (
    <>
      {points.map((point, index) => (
        <mesh key={point.id} position={point.position}>
          <sphereGeometry args={[0.02]} />
          <meshBasicMaterial color="#ff4444" />
          <Html distanceFactor={10}>
            <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
              P{index + 1}
            </div>
          </Html>
        </mesh>
      ))}
      
      {points.length === 2 && (
        <>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([
                  points[0].position.x, points[0].position.y, points[0].position.z,
                  points[1].position.x, points[1].position.y, points[1].position.z
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#ff4444" linewidth={2} />
          </line>
          
          <Html
            position={[
              (points[0].position.x + points[1].position.x) / 2,
              (points[0].position.y + points[1].position.y) / 2,
              (points[0].position.z + points[1].position.z) / 2
            ]}
            distanceFactor={10}
          >
            <div className="bg-primary-500 text-white px-2 py-1 rounded text-xs font-medium">
              {points[0].position.distanceTo(points[1].position).toFixed(2)}m
            </div>
          </Html>
        </>
      )}
    </>
  )
}

export function ModelViewer({ 
  modelUrl = "/models/sample.ply",
  pointCloudUrl,
  className = "",
  showControls = true,
  autoRotate = false 
}: ModelViewerProps) {
  const [wireframe, setWireframe] = useState(false)
  const [showPointCloud, setShowPointCloud] = useState(true)
  const [measurementMode, setMeasurementMode] = useState(false)
  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([])
  const [resetCamera, setResetCamera] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate demo point cloud data
  const demoPointCloud = new Float32Array(30000)
  for (let i = 0; i < 10000; i++) {
    demoPointCloud[i * 3] = (Math.random() - 0.5) * 10
    demoPointCloud[i * 3 + 1] = (Math.random() - 0.5) * 10
    demoPointCloud[i * 3 + 2] = (Math.random() - 0.5) * 10
  }

  const handleAddMeasurementPoint = useCallback((point: THREE.Vector3) => {
    if (measurementPoints.length >= 2) {
      setMeasurementPoints([{ position: point, id: Date.now().toString() }])
    } else {
      setMeasurementPoints(prev => [...prev, { position: point, id: Date.now().toString() }])
    }
  }, [measurementPoints])

  const handleReset = () => {
    setResetCamera(true)
    setMeasurementPoints([])
    setTimeout(() => setResetCamera(false), 100)
  }

  const handleToggleMeasurement = () => {
    setMeasurementMode(!measurementMode)
    if (measurementMode) {
      setMeasurementPoints([])
    }
  }

  const handleDownload = () => {
    // Implement download functionality
    console.log('Download model')
  }

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-950 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando modelo 3D...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-gray-950 flex items-center justify-center z-20">
          <div className="text-center">
            <h3 className="text-lg font-medium text-white mb-2">Error al cargar el modelo</h3>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      )}

      <Canvas
        camera={{ position: [5, 5, 5], fov: 75 }}
        className="bg-gray-950"
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <directionalLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Environment for better reflections */}
        <Environment preset="studio" />
        
        {/* Load real PLY model if URL provided, otherwise show demo cube */}
        {pointCloudUrl ? (
          <PLYModel url={pointCloudUrl} />
        ) : modelUrl ? (
          <PLYModel url={modelUrl} />
        ) : (
          <>
            {/* Demo cube since we don't have actual models */}
            <mesh>
              <boxGeometry args={[2, 2, 2]} />
              <meshStandardMaterial 
                color="#4a90e2" 
                wireframe={wireframe}
                metalness={0.3}
                roughness={0.4}
              />
            </mesh>
            
            {/* Point cloud */}
            <PointCloud points={demoPointCloud} visible={showPointCloud} />
          </>
        )}
        
        {/* Measurement tool */}
        <MeasurementTool 
          enabled={measurementMode}
          points={measurementPoints}
          onAddPoint={handleAddMeasurementPoint}
        />
        
        {/* Camera controls */}
        <CameraController onReset={resetCamera} />
        
        {/* Grid */}
        <gridHelper args={[20, 20, '#333333', '#333333']} />
      </Canvas>

      {/* Controls */}
      {showControls && (
        <ViewerControls
          onReset={handleReset}
          onToggleWireframe={() => setWireframe(!wireframe)}
          onTogglePointCloud={() => setShowPointCloud(!showPointCloud)}
          onToggleMeasurement={handleToggleMeasurement}
          onDownload={handleDownload}
          wireframe={wireframe}
          showPointCloud={showPointCloud}
          measurementMode={measurementMode}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}

      {/* Measurement info */}
      {measurementMode && (
        <div className="absolute bottom-4 left-4 z-10">
          <Card className="p-3 bg-gray-900/90 backdrop-blur-sm border-gray-700">
            <div className="text-sm text-white">
              <p className="font-medium mb-1">Herramienta de Medición</p>
              <p className="text-gray-400 text-xs">
                {measurementPoints.length === 0 && "Haz clic en dos puntos para medir la distancia"}
                {measurementPoints.length === 1 && "Selecciona el segundo punto"}
                {measurementPoints.length === 2 && "Medición completada"}
              </p>
              {measurementPoints.length === 2 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setMeasurementPoints([])}
                >
                  Nueva Medición
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}