'use client'

import { Project } from '@/types'

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-750 transition-colors duration-200" onClick={onClick}>
      {/* 3D Model Preview */}
      <div className="w-full h-48 bg-gray-600 rounded-lg mb-4 flex items-center justify-center">
        <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      </div>
      
      {/* Project Info */}
      <div className="space-y-3">
        <div className="text-gray-400 text-sm font-mono">
          Actualizado: {new Date(project.updated_at).toLocaleDateString('es-ES')}
        </div>
        
        <h3 className="text-lg font-bold text-white font-mono">{project.name}</h3>
        
        {project.description && (
          <p className="text-gray-400 text-sm font-mono">{project.description}</p>
        )}
        
        {project.location && (
          <div className="flex items-center text-gray-400 text-sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {project.location}
          </div>
        )}
      </div>
    </div>
  )
}
