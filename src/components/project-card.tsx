'use client'

import { motion } from 'framer-motion'
import { MapPin, Calendar } from 'lucide-react'
import { Project } from '@/types'

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <motion.div
      className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-750 transition-colors duration-200"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* 3D Model Preview */}
      <div className="w-full h-48 bg-gray-600 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
        <div className="w-16 h-16 bg-gray-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        {/* Placeholder for 3D model preview */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-700 opacity-50"></div>
      </div>

      {/* Project Info */}
      <div className="space-y-3">
        <div className="flex items-center text-gray-400 text-sm font-mono">
          <Calendar className="w-4 h-4 mr-2" />
          Actualizado: {new Date(project.updated_at).toLocaleDateString('es-ES')}
        </div>

        <h3 className="text-lg font-bold text-white font-mono line-clamp-2">
          {project.name}
        </h3>

        {project.description && (
          <p className="text-gray-400 text-sm font-mono line-clamp-2">
            {project.description}
          </p>
        )}

        {project.location && (
          <div className="flex items-center text-gray-400 text-sm">
            <MapPin className="w-4 h-4 mr-2" />
            {project.location}
          </div>
        )}
      </div>
    </motion.div>
  )
}