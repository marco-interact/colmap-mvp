import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import { Mesh, Group } from 'three';
import { LoadingSpinner } from './LoadingSpinner';

interface ModelViewerProps {
  projectId: number;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({ projectId }) => {
  const meshRef = useRef<Group>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // This would typically load the actual 3D model from the API
  // For now, we'll create a placeholder model
  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [projectId]);

  // Auto-rotate animation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
    }
  });

  if (loading) {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
    );
  }

  if (error) {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    );
  }

  // Placeholder 3D model - in a real implementation, this would load the actual model
  return (
    <group ref={meshRef}>
      {/* Main structure */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#8b5cf6" />
      </mesh>
      
      {/* Additional details */}
      <mesh position={[1.5, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      
      <mesh position={[-1.5, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>
      
      <mesh position={[0, 1.5, 1.5]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      
      <mesh position={[0, 1.5, -1.5]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#06b6d4" />
      </mesh>
    </group>
  );
};

// Hook to load GLTF models (for future use)
const useModelLoader = (url: string) => {
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // This would load the actual model from the API
    // For now, we'll simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [url]);

  return { model, loading, error };
};

// Component for loading actual GLTF models
export const GLTFModelViewer: React.FC<ModelViewerProps> = ({ projectId }) => {
  const { model, loading, error } = useModelLoader(`/api/models/${projectId}/mesh.gltf`);

  if (loading) {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
    );
  }

  if (error) {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    );
  }

  // This would render the actual loaded model
  return (
    <primitive object={model} scale={1} position={[0, 0, 0]} />
  );
};




