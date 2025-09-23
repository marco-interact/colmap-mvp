// pages/DashboardPage.tsx
// Main dashboard page with sidebar, header, and project grid
// Responsive layout with mobile-first approach

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Menu } from 'lucide-react';
import { Sidebar } from '../components/Sidebar.tsx';
import { ProjectCard } from '../components/ProjectCard.tsx';
import { NewProjectForm } from '../components/NewProjectForm.tsx';
import { NewScanForm } from '../components/NewScanForm.tsx';

// Mock data for demonstration
const mockProjects = [
  {
    id: '1',
    title: 'ITECSA Nave Industrial',
    description: 'Render de sitio de obra para Desarrollo Inmobiliario ITECSA',
    location: 'Playa del Carmen',
    updatedAt: '26-08-2025',
    thumbnail: undefined
  },
  {
    id: '2', 
    title: 'Casa Residencial Tulum',
    description: 'Escaneo 3D completo de propiedad residencial para documentación arquitectónica',
    location: 'Tulum, Quintana Roo',
    updatedAt: '25-08-2025',
    thumbnail: undefined
  },
  {
    id: '3',
    title: 'Centro Comercial Plaza Maya',
    description: 'Levantamiento digital de espacios comerciales para renovación',
    location: 'Cancún, Quintana Roo', 
    updatedAt: '24-08-2025',
    thumbnail: undefined
  }
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewScanModal, setShowNewScanModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = mockProjects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProjectSubmit = (data: any) => {
    console.log('New project data:', data);
    // Here you would typically send the data to your API
    setShowNewProjectModal(false);
  };

  const handleScanSubmit = (data: any) => {
    console.log('New scan data:', data);
    // Here you would typically send the data to your API
    setShowNewScanModal(false);
  };

  const handleProjectClick = (projectId: string) => {
    console.log('Opening project:', projectId);
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content */}
      <div className="lg:ml-80 pb-20 lg:pb-0">
        {/* Top Bar */}
        <header className="bg-gray-900 border-b border-gray-800 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo (Mobile) */}
            <div className="lg:hidden">
              <h1 className="text-emerald-400 text-xl font-bold">DoMapping</h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md relative">
              <div className="relative">
                <Search 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
                  aria-hidden="true" 
                />
                <input
                  type="text"
                  placeholder="Search Project"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                  aria-label="Buscar proyectos"
                />
              </div>
            </div>

            {/* New Project Button */}
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="bg-emerald-400 hover:bg-emerald-500 text-black font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
              aria-label="Crear nuevo proyecto"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">NEW PROJECT</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              Mis Proyectos
            </h1>
            <p className="text-gray-400 text-sm lg:text-base">
              {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? 's' : ''} 
              {searchQuery && ` encontrado${filteredProjects.length !== 1 ? 's' : ''} para "${searchQuery}"`}
            </p>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  {...project}
                  onClick={() => handleProjectClick(project.id)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-500" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {searchQuery ? 'No se encontraron proyectos' : 'No hay proyectos'}
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? `No hay proyectos que coincidan con "${searchQuery}". Intenta con otros términos.`
                  : 'Crea tu primer proyecto para comenzar a generar modelos 3D.'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="bg-emerald-400 hover:bg-emerald-500 text-black font-semibold px-6 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" aria-hidden="true" />
                  Crear Proyecto
                </button>
              )}
            </div>
          )}

          {/* Quick Actions (Mobile) */}
          <div className="lg:hidden fixed bottom-24 right-4 flex flex-col gap-3">
            <button
              onClick={() => setShowNewScanModal(true)}
              className="w-14 h-14 bg-gray-800 hover:bg-gray-700 text-emerald-400 rounded-full shadow-lg flex items-center justify-center transition-colors"
              aria-label="Nuevo scan"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </main>
      </div>

      {/* Modals */}
      <NewProjectForm
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSubmit={handleProjectSubmit}
      />

      <NewScanForm
        isOpen={showNewScanModal}
        onClose={() => setShowNewScanModal(false)}
        onSubmit={handleScanSubmit}
      />
    </div>
  );
};