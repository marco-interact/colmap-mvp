import React, { Suspense, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Stats } from '@react-three/drei';
import { ArrowLeft, Ruler, Eye, Download, Settings, Home } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner.tsx';
import { ViewerControls } from '../components/ViewerControls.tsx';
import { ModelViewer } from '../components/ModelViewer.tsx';

export const ViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id!);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [measurements, setMeasurements] = useState<Array<{id: string, points: any[], distance: number}>>([]);

  const toggleMeasurementMode = () => {
    setMeasurementMode(!measurementMode);
  };

  const clearMeasurements = () => {
    setMeasurements([]);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to={`/projects/${projectId}`}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white">3D Model Viewer</h1>
              <p className="text-sm text-gray-400">ITECSA Nave Industrial - Scan Principal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMeasurementMode}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                measurementMode 
                  ? 'bg-emerald-500 text-black' 
                  : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
              }`}
            >
              <Ruler className="w-4 h-4" />
              {measurementMode ? 'Exit Measure' : 'Measure'}
            </button>
            
            {measurements.length > 0 && (
              <button
                onClick={clearMeasurements}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Clear Measurements
              </button>
            )}
            
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Download className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <LoadingSpinner size="large" text="Loading 3D model..." />
          </div>
        }>
          <Canvas
            camera={{ position: [5, 5, 5], fov: 50 }}
            shadows
            gl={{ antialias: true, alpha: true }}
          >
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

            {/* Environment */}
            <Environment preset="studio" />

            {/* Grid */}
            <Grid
              position={[0, -1, 0]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#6f6f6f"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#9d4edd"
              fadeDistance={30}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid={true}
            />

            {/* 3D Model */}
            <ModelViewer projectId={projectId} />

            {/* Controls */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={20}
            />

            {/* Performance Stats */}
            <Stats />
          </Canvas>
        </Suspense>

        {/* Status Overlay */}
        <div className="absolute top-4 left-4 bg-gray-900/90 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>Model Loaded</span>
          </div>
        </div>

        {/* Measurement Panel */}
        {measurementMode && (
          <div className="absolute top-4 right-4 bg-gray-900/90 border border-gray-700 text-white px-4 py-3 rounded-lg text-sm max-w-sm">
            <h4 className="font-medium mb-2 text-emerald-400">Measurement Mode</h4>
            <p className="text-xs text-gray-300 mb-3">Click two points on the model to measure distance</p>
            {measurements.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-400">Measurements:</h5>
                {measurements.map((measurement, index) => (
                  <div key={measurement.id} className="text-xs bg-gray-800 px-2 py-1 rounded">
                    Measurement {index + 1}: {measurement.distance.toFixed(2)}m
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-gray-900/90 border border-gray-700 text-white px-4 py-3 rounded-lg text-sm max-w-sm">
          <h4 className="font-medium mb-2">Controls:</h4>
          <ul className="space-y-1 text-xs">
            <li>• Left click + drag: Rotate view</li>
            <li>• Right click + drag: Pan camera</li>
            <li>• Mouse wheel: Zoom in/out</li>
            <li>• Double click: Reset view</li>
            {measurementMode && (
              <li className="text-emerald-400">• Click points: Measure distance</li>
            )}
          </ul>
        </div>

        {/* Model Info */}
        <div className="absolute bottom-4 right-4 bg-gray-900/90 border border-gray-700 text-white px-4 py-3 rounded-lg text-sm">
          <h4 className="font-medium mb-2">Model Info:</h4>
          <div className="space-y-1 text-xs">
            <div>Format: PLY Point Cloud</div>
            <div>Points: ~45,000</div>
            <div>Quality: High</div>
            <div>File Size: 12.3 MB</div>
          </div>
        </div>
      </div>
    </div>
  );
};


