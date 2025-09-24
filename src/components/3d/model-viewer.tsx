'use client'

import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Environment, Grid } from '@react-three/drei'
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js'
import { Mesh, BufferGeometry, PointsMaterial, Points, Color } from 'three'
import { 
  RotateCcw, 
  Move3d, 
  Ruler, 
  Eye, 
  EyeOff, 
  Download,
  Maximize,
  Settings 
} from 'lucide-react'

interface ModelViewerProps {
  modelUrl?: string
  modelType?: 'pointcloud' | 'mesh'
  className?: string
}

function PointCloudModel({ url }: { url: string }) {
  const geometry = useLoader(PLYLoader, url) as BufferGeometry
  const meshRef = useRef<Points>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002
    }
  })

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        size={0.01}
        color={new Color('#4ECDC4')}
        sizeAttenuation
        transparent
        opacity={0.8}
      />
    </points>
  )
}

function MeshModel({ url }: { url: string }) {
  const geometry = useLoader(PLYLoader, url) as BufferGeometry
  const meshRef = useRef<Mesh>(null)

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#4ECDC4"
        metalness={0.1}
        roughness={0.3}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}

export function ModelViewer({ modelUrl, modelType = 'pointcloud', className }: ModelViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showControls, setShowControls] = useState(true)
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([5, 5, 5])
  const [showGrid, setShowGrid] = useState(true)

  const handleResetView = () => {
    setCameraPosition([5, 5, 5])
  }

  const handleDownload = () => {
    if (modelUrl) {
      const link = document.createElement('a')
      link.href = modelUrl
      link.download = `model.ply`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className={`model-viewer ${className || ''}`}>
      {/* Viewer Controls */}
      <div className={`viewer-controls ${showControls ? 'visible' : 'hidden'}`}>
        <div className="controls-group">
          <button
            className="control-btn"
            onClick={handleResetView}
            title="Reset View"
          >
            <RotateCcw size={18} />
          </button>
          <button
            className="control-btn"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Grid"
          >
            {showGrid ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button
            className="control-btn"
            onClick={handleDownload}
            title="Download Model"
            disabled={!modelUrl}
          >
            <Download size={18} />
          </button>
        </div>
        
        <button
          className="controls-toggle"
          onClick={() => setShowControls(!showControls)}
          title="Toggle Controls"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* 3D Canvas */}
      <Canvas className="viewer-canvas">
        <PerspectiveCamera
          makeDefault
          position={cameraPosition}
          fov={60}
          near={0.1}
          far={1000}
        />
        
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />

        {/* Environment */}
        <Environment preset="city" />
        
        {/* Grid */}
        {showGrid && (
          <Grid
            position={[0, -2, 0]}
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#333333"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#4ECDC4"
            fadeDistance={50}
            fadeStrength={1}
          />
        )}

        {/* 3D Model */}
        {modelUrl ? (
          modelType === 'pointcloud' ? (
            <PointCloudModel url={modelUrl} />
          ) : (
            <MeshModel url={modelUrl} />
          )
        ) : (
          // Placeholder 3D scene
          <group>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[2, 2, 2]} />
              <meshStandardMaterial
                color="#4ECDC4"
                transparent
                opacity={0.3}
                wireframe
              />
            </mesh>
            <points>
              <sphereGeometry args={[3, 50, 50]} />
              <pointsMaterial
                size={0.05}
                color="#4ECDC4"
                transparent
                opacity={0.6}
              />
            </points>
          </group>
        )}
      </Canvas>

      {/* Loading State */}
      {isLoading && modelUrl && (
        <div className="viewer-loading">
          <div className="loading-spinner" />
          <p>Cargando modelo 3D...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="viewer-error">
          <p>Error al cargar el modelo: {error}</p>
        </div>
      )}

      {/* Info Panel */}
      <div className="viewer-info">
        <div className="info-item">
          <span className="info-label">Tipo:</span>
          <span className="info-value">
            {modelType === 'pointcloud' ? 'Nube de Puntos' : 'Malla 3D'}
          </span>
        </div>
        {modelUrl && (
          <div className="info-item">
            <span className="info-label">Estado:</span>
            <span className="info-value">Listo</span>
          </div>
        )}
      </div>
    </div>
  )
}

// CSS Styles for the 3D viewer
const viewerStyles = `
.model-viewer {
  position: relative;
  width: 100%;
  height: 500px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.viewer-canvas {
  width: 100% !important;
  height: 100% !important;
}

.viewer-controls {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  display: flex;
  gap: var(--spacing-sm);
  z-index: 10;
  transition: opacity 0.3s ease;
}

.viewer-controls.hidden {
  opacity: 0.3;
}

.controls-group {
  display: flex;
  gap: var(--spacing-xs);
  background: rgba(26, 26, 26, 0.9);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs);
  backdrop-filter: blur(8px);
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.controls-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(26, 26, 26, 0.9);
  border: 1px solid var(--border-primary);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.controls-toggle:hover {
  background: var(--bg-tertiary);
  color: var(--brand-primary);
}

.viewer-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  color: var(--text-secondary);
  z-index: 5;
}

.viewer-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--error);
  z-index: 5;
}

.viewer-info {
  position: absolute;
  bottom: var(--spacing-md);
  left: var(--spacing-md);
  background: rgba(26, 26, 26, 0.9);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  backdrop-filter: blur(8px);
  z-index: 10;
}

.info-item {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 500;
  min-width: 40px;
}

.info-value {
  color: var(--text-primary);
  font-size: 0.75rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .viewer-controls {
    top: var(--spacing-sm);
    right: var(--spacing-sm);
  }
  
  .viewer-info {
    bottom: var(--spacing-sm);
    left: var(--spacing-sm);
  }
  
  .controls-group {
    flex-direction: column;
  }
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = viewerStyles
  document.head.appendChild(styleSheet)
}
