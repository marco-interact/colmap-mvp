/**
 * Simple Three.js 3D Viewer
 * Based on the standard Three.js viewer pattern provided by the user
 * Reliable fallback for COLMAP 3D model viewing
 */

'use client'

import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { X, RotateCcw, Maximize } from 'lucide-react'

interface SimpleThreeViewerProps {
  projectId: string
  scanId: string
  modelUrl?: string
  onClose?: () => void
  className?: string
}

export function SimpleThreeViewer({
  projectId,
  scanId,
  modelUrl = '/models/sample.ply',
  onClose,
  className = ''
}: SimpleThreeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Three.js refs
  const sceneRef = useRef<THREE.Scene>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const controlsRef = useRef<OrbitControls>()
  const modelRef = useRef<THREE.Group>()

  useEffect(() => {
    if (!containerRef.current) return

    // 1. Scene Setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x2a2a2a)
    sceneRef.current = scene

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 5, 10)
    cameraRef.current = camera

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0xffffff, 0.3)
    pointLight.position.set(-10, -10, -5)
    scene.add(pointLight)

    // 5. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 1
    controls.maxDistance = 100
    controls.enablePan = true
    controls.enableZoom = true
    controls.enableRotate = true
    controlsRef.current = controls

    // 6. Load 3D Model
    const loadModel = () => {
      const modelGroup = new THREE.Group()
      modelRef.current = modelGroup
      scene.add(modelGroup)

      // Determine loader based on file extension
      const extension = modelUrl.split('.').pop()?.toLowerCase()
      
      const onProgress = (progress: ProgressEvent) => {
        const percentComplete = progress.loaded / progress.total * 100
        console.log(`Loading progress: ${percentComplete.toFixed(2)}%`)
      }

      const onError = (error: any) => {
        console.error('Model loading error:', error)
        setError(`Failed to load 3D model: ${error.message || 'Unknown error'}`)
        setIsLoading(false)
      }

      const onLoad = (object: any) => {
        let modelObject: THREE.Object3D

        if (object.scene) {
          // GLTF
          modelObject = object.scene
        } else if (object.isBufferGeometry) {
          // PLY
          const material = new THREE.PointsMaterial({
            size: 0.01,
            sizeAttenuation: true,
            vertexColors: true
          })
          modelObject = new THREE.Points(object, material)
        } else {
          // OBJ or other
          modelObject = object
        }

        // Add to scene
        modelGroup.add(modelObject)

        // Center and scale the model
        const box = new THREE.Box3().setFromObject(modelGroup)
        const size = box.getSize(new THREE.Vector3())
        const maxSize = Math.max(size.x, size.y, size.z)
        const scale = 5 / maxSize
        modelGroup.scale.setScalar(scale)

        const center = box.getCenter(new THREE.Vector3())
        modelGroup.position.sub(center.multiplyScalar(scale))

        // Adjust camera position
        const distance = maxSize * 1.5
        camera.position.set(distance, distance * 0.5, distance)
        camera.lookAt(0, 0, 0)
        controls.update()

        setIsLoading(false)
        setError(null)
      }

      try {
        switch (extension) {
          case 'gltf':
          case 'glb':
            const gltfLoader = new GLTFLoader()
            gltfLoader.load(modelUrl, onLoad, onProgress, onError)
            break

          case 'obj':
            const objLoader = new OBJLoader()
            objLoader.load(modelUrl, onLoad, onProgress, onError)
            break

          case 'ply':
          default:
            const plyLoader = new PLYLoader()
            plyLoader.load(modelUrl, onLoad, onProgress, onError)
            break
        }
      } catch (err) {
        onError(err)
      }
    }

    loadModel()

    // 7. Animation Loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // 8. Handle Window Resizing
    const handleResize = () => {
      if (!containerRef.current) return
      
      const width = containerRef.current.clientWidth
      const height = containerRef.current.clientHeight
      
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      
      // Dispose of Three.js objects
      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (containerRef.current?.contains(rendererRef.current.domElement)) {
          containerRef.current.removeChild(rendererRef.current.domElement)
        }
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose()
      }
      
      // Clear scene
      if (sceneRef.current) {
        sceneRef.current.clear()
      }
    }
  }, [modelUrl])

  const resetCamera = () => {
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.reset()
      cameraRef.current.position.set(0, 5, 10)
      controlsRef.current.update()
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  if (error) {
    return (
      <div className={`simple-three-viewer error ${className}`}>
        <div className="error-container">
          <h3>Failed to Load 3D Model</h3>
          <p>{error}</p>
          <button onClick={onClose} className="btn-primary">
            Close Viewer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`simple-three-viewer ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Loading 3D Model...</p>
        </div>
      )}

      {/* Controls */}
      <div className="viewer-controls">
        <button onClick={resetCamera} className="btn-control" title="Reset Camera">
          <RotateCcw size={20} />
        </button>
        <button onClick={toggleFullscreen} className="btn-control" title="Toggle Fullscreen">
          <Maximize size={20} />
        </button>
        {onClose && (
          <button onClick={onClose} className="btn-control btn-close" title="Close">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Three.js Container */}
      <div 
        ref={containerRef} 
        className="three-container"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Info Panel */}
      <div className="info-panel">
        <div className="info-item">
          <span className="label">Project:</span>
          <span className="value">{projectId}</span>
        </div>
        <div className="info-item">
          <span className="label">Scan:</span>
          <span className="value">{scanId}</span>
        </div>
        <div className="info-item">
          <span className="label">Format:</span>
          <span className="value">{modelUrl.split('.').pop()?.toUpperCase()}</span>
        </div>
      </div>

      <style jsx>{`
        .simple-three-viewer {
          position: relative;
          width: 100%;
          height: 100vh;
          background: #1a1a1a;
          overflow: hidden;
        }

        .simple-three-viewer.error {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .error-container {
          text-align: center;
          color: white;
          background: rgba(0, 0, 0, 0.8);
          padding: 2rem;
          border-radius: 8px;
        }

        .error-container h3 {
          color: #ff6b6b;
          margin-bottom: 1rem;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          z-index: 10;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid #4ecdc4;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .viewer-controls {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 10px;
          z-index: 5;
        }

        .btn-control {
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: white;
          padding: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-control:hover {
          background: rgba(0, 0, 0, 0.9);
          border-color: #4ecdc4;
          color: #4ecdc4;
        }

        .btn-close {
          background: rgba(220, 53, 69, 0.8);
        }

        .btn-close:hover {
          background: rgba(220, 53, 69, 1);
          border-color: #dc3545;
        }

        .btn-primary {
          background: #4ecdc4;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.2s ease;
        }

        .btn-primary:hover {
          background: #45b7aa;
        }

        .info-panel {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.7);
          border-radius: 6px;
          padding: 15px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          z-index: 5;
        }

        .info-item {
          display: flex;
          margin-bottom: 8px;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        .label {
          font-weight: 600;
          margin-right: 10px;
          min-width: 60px;
          color: rgba(255, 255, 255, 0.7);
        }

        .value {
          color: #4ecdc4;
          font-weight: 500;
        }

        .three-container {
          cursor: grab;
        }

        .three-container:active {
          cursor: grabbing;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .viewer-controls {
            top: 10px;
            right: 10px;
            gap: 8px;
          }

          .btn-control {
            padding: 8px;
          }

          .info-panel {
            bottom: 10px;
            left: 10px;
            padding: 12px;
            font-size: 12px;
          }

          .label {
            min-width: 50px;
          }
        }
      `}</style>
    </div>
  )
}
