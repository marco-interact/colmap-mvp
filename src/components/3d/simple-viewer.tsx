"use client"

import { useRef, useEffect, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Html } from "@react-three/drei"
import * as THREE from "three"
import { PLYLoader } from "three-stdlib"

interface SimpleViewerProps {
  modelUrl?: string
  className?: string
}

// PLY Model Loader Component
function PLYModel({ url }: { url: string }) {
  const pointsRef = useRef<THREE.Points>(null)
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
      (loadedGeometry) => {
        // Center the geometry
        loadedGeometry.computeBoundingBox()
        const center = new THREE.Vector3()
        loadedGeometry.boundingBox?.getCenter(center)
        loadedGeometry.translate(-center.x, -center.y, -center.z)
        
        // Normalize scale
        const box = new THREE.Box3().setFromBufferAttribute(
          loadedGeometry.attributes.position as THREE.BufferAttribute
        )
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 5 / maxDim
        loadedGeometry.scale(scale, scale, scale)
        
        setGeometry(loadedGeometry)
        setLoading(false)
        console.log('PLY loaded successfully:', url)
      },
      (progress) => {
        console.log('Loading progress:', (progress.loaded / progress.total * 100).toFixed(2) + '%')
      },
      (err) => {
        console.error('Error loading PLY:', err)
        setError('Failed to load 3D model')
        setLoading(false)
      }
    )
  }, [url])

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001
    }
  })

  if (loading) {
    return (
      <Html center>
        <div className="text-white text-sm bg-gray-800/90 px-4 py-2 rounded">
          Loading 3D model...
        </div>
      </Html>
    )
  }

  if (error) {
    return (
      <Html center>
        <div className="text-red-400 text-sm bg-gray-800/90 px-4 py-2 rounded">
          {error}
        </div>
      </Html>
    )
  }

  if (!geometry) return null

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.015}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.9}
      />
    </points>
  )
}

// Fallback point cloud component for demo
function DemoPointCloud({ visible = true }: { visible?: boolean }) {
  const pointsRef = useRef<THREE.Points>(null)
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)

  useEffect(() => {
    // Create a simple point cloud geometry
    const points = new Float32Array(30000)
    const colors = new Float32Array(30000)
    
    for (let i = 0; i < 10000; i++) {
      const radius = Math.random() * 5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      
      points[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      points[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      points[i * 3 + 2] = radius * Math.cos(phi)
      
      colors[i * 3] = Math.random()
      colors[i * 3 + 1] = Math.random()
      colors[i * 3 + 2] = Math.random()
    }
    
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(points, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    setGeometry(geo)
  }, [])

  if (!geometry || !visible) return null

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.02}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.8}
      />
    </points>
  )
}

// Simple mesh component
function SimpleMesh({ visible = true }: { visible?: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)

  useEffect(() => {
    // Create a simple mesh geometry
    const geo = new THREE.BoxGeometry(2, 2, 2)
    setGeometry(geo)
  }, [])

  if (!geometry || !visible) return null

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#4a90e2"
        wireframe={false}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  )
}

// Camera controller
function CameraController() {
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.set(5, 5, 5)
    camera.lookAt(0, 0, 0)
  }, [camera])

  return null
}

export function SimpleViewer({ modelUrl, className = "" }: SimpleViewerProps) {
  const [viewMode, setViewMode] = useState<'pointcloud' | 'mesh'>('pointcloud')

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [5, 5, 5], fov: 75 }}
        className="bg-gray-900"
        gl={{ antialias: false, powerPreference: "low-power" }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <directionalLight position={[-10, -10, -10]} intensity={0.3} />
        
        {/* Grid helper */}
        <gridHelper args={[20, 20, '#444444', '#222222']} />
        
        {/* Model content - Load actual PLY if URL provided, otherwise show demo */}
        {modelUrl ? (
          <PLYModel url={modelUrl} />
        ) : (
          <>
            {viewMode === 'pointcloud' ? (
              <DemoPointCloud visible={true} />
            ) : (
              <SimpleMesh visible={true} />
            )}
          </>
        )}
        
        {/* Camera controls */}
        <OrbitControls
          enableDamping={true}
          dampingFactor={0.05}
          screenSpacePanning={false}
          minDistance={1}
          maxDistance={100}
          maxPolarAngle={Math.PI}
        />
        
        <CameraController />
      </Canvas>

      {/* Controls - only show if no model URL (demo mode) */}
      {!modelUrl && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('pointcloud')}
                className={`px-3 py-1 text-xs rounded ${
                  viewMode === 'pointcloud' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Points
              </button>
              <button
                onClick={() => setViewMode('mesh')}
                className={`px-3 py-1 text-xs rounded ${
                  viewMode === 'mesh' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Mesh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute bottom-4 left-4">
        <div className="bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-lg">
          <span className="text-white text-sm">
            {modelUrl ? '3D Point Cloud' : `Demo ${viewMode}`}
          </span>
        </div>
      </div>
    </div>
  )
}


