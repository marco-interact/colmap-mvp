'use client'

import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'

interface ModelViewerProps {
  modelUrl?: string
  className?: string
}

function Scene({ modelUrl }: { modelUrl?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { scene } = useThree()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (modelUrl) {
      // Load 3D model here
      // For now, we'll use a placeholder geometry
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [modelUrl])

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

      {/* Placeholder Geometry */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#22c55e" wireframe />
      </mesh>

      {/* Stats for performance monitoring */}
      <Stats />
    </>
  )
}

export function ModelViewer({ modelUrl, className = '' }: ModelViewerProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className={`w-full h-full bg-gray-600 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-400 font-mono text-sm">Loading 3D model...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={`w-full h-full bg-gray-600 rounded-lg overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Canvas
        camera={{ position: [5, 5, 5], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Scene modelUrl={modelUrl} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={20}
        />
      </Canvas>
    </motion.div>
  )
}

