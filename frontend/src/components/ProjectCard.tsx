// components/ProjectCard.tsx
// Reusable project card component with thumbnail, metadata, and location
// Includes hover states and responsive design

import React from 'react';
import { MapPin, Calendar } from 'lucide-react';

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  location: string;
  updatedAt: string;
  thumbnail?: string;
  onClick?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  title,
  description,
  location,
  updatedAt,
  thumbnail,
  onClick
}) => {
  return (
    <div 
      className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden hover:shadow-lg hover:border-gray-600 transition-all duration-200 cursor-pointer group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Abrir proyecto ${title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-700 relative overflow-hidden">
        {thumbnail ? (
          <img 
            src={thumbnail} 
            alt={`Vista previa de ${title}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          // Placeholder with 3D pattern
          <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
            <div className="w-16 h-16 bg-gray-500 rounded-lg flex items-center justify-center opacity-50">
              <span className="text-gray-300 font-bold text-lg">3D</span>
            </div>
          </div>
        )}
        
        {/* Date overlay */}
        <div className="absolute top-3 left-3">
          <div className="bg-black bg-opacity-60 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gray-300" aria-hidden="true" />
            <span className="text-xs text-gray-300">
              Actualizado: {updatedAt}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 
          className="text-lg font-bold text-white line-clamp-2 group-hover:text-emerald-400 transition-colors"
          title={title}
        >
          {title}
        </h3>

        {/* Description */}
        <p 
          className="text-sm text-gray-300 line-clamp-2 leading-relaxed"
          title={description}
        >
          {description}
        </p>

        {/* Location */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
          <span className="text-xs text-gray-400 truncate" title={location}>
            {location}
          </span>
        </div>
      </div>
    </div>
  );
};



