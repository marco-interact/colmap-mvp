"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Clock, Settings, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Modal, ModalContent, ModalFooter } from "@/components/ui/modal"
import { ServiceStatus } from "@/components/service-status"
import { Progress } from "@/components/ui/progress"
import { apiClient } from "@/lib/api"

interface Project {
  id: string
  name: string
  description: string
  updated: string
  thumbnail: string
  location: string
  status?: 'active' | 'processing' | 'completed'
  activeScans?: number
  totalScans?: number
  processingProgress?: number
}

interface Scan {
  id: string
  projectId: string
  name: string
  status: 'completed' | 'processing' | 'failed' | 'pending'
  updated: string
  thumbnail: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [recentScans, setRecentScans] = useState<Scan[]>([])
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userName, setUserName] = useState("")
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    location: "",
    spaceType: "",
    projectType: ""
  })

  // Check authentication and load data
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const email = localStorage.getItem('user_email')
    
    if (!token) {
      router.push('/auth/login')
      return
    }
    
    // Extract name from email
    if (email) {
      const name = email.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1).replace(/[._]/g, ' '))
    }
    
    loadDashboardData()
  }, [router])

  const loadDashboardData = async () => {
    try {
      // Load projects from API
      const response = await apiClient.getAllProjects()
      if (response && response.projects) {
        // Load scans for each project to calculate processing status
        const projectsWithStatus = await Promise.all(
          response.projects.map(async (project: any) => {
            try {
              const scansData = await apiClient.getScans(project.id)
              const scans = scansData?.scans || []
              
              const totalScans = scans.length
              const processingScans = scans.filter((s: any) => s.status === 'processing' || s.status === 'pending').length
              const completedScans = scans.filter((s: any) => s.status === 'completed').length
              
              // Calculate progress: (completed / total) * 100
              const progress = totalScans > 0 ? Math.round((completedScans / totalScans) * 100) : 100
              
              // Use project thumbnail API (shows first scan's first frame)
              // Next.js rewrites /api/backend/* to http://localhost:8000/*
              // Backend route: /api/projects/{id}/thumbnail.jpg
              const thumbnailUrl = `/api/backend/api/projects/${project.id}/thumbnail.jpg`
              
              return {
                id: project.id,
                name: project.name,
                description: project.description || "COLMAP 3D reconstruction project",
                updated: new Date(project.updated_at || project.created_at).toLocaleDateString('en-GB'),
                location: project.location || "Location TBD",
                thumbnail: thumbnailUrl,
                status: processingScans > 0 ? 'processing' as const : 
                        completedScans > 0 ? 'completed' as const : 'active' as const,
                activeScans: processingScans,
                totalScans,
                processingProgress: progress
              }
            } catch (error) {
              // If scan loading fails, return project without scan info
              return {
                id: project.id,
                name: project.name,
                description: project.description || "COLMAP 3D reconstruction project",
                updated: new Date(project.updated_at || project.created_at).toLocaleDateString('en-GB'),
                location: project.location || "Location TBD",
                thumbnail: "/api/assets/sample-industrial.jpg",
                status: 'active' as const,
                activeScans: 0,
                totalScans: 0,
                processingProgress: 100
              }
            }
          })
        )
        
        setProjects(projectsWithStatus)
      } else {
        // Fallback to empty if API fails
        setProjects([])
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setProjects([])
    }
  }

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return

    const project: Project = {
      id: Date.now().toString(),
      name: newProject.name,
      description: newProject.description || "New videogrammetry project",
      updated: new Date().toLocaleDateString('en-GB'),
      location: "Location TBD",
      thumbnail: "/api/assets/sample-industrial.jpg"
    }
    
    setProjects(prev => [project, ...prev])
    setNewProject({ name: "", description: "", location: "", spaceType: "", projectType: "" })
    setIsNewProjectModalOpen(false)
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#000] border-r border-gray-700/30 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary-400 font-mono">Colmap App</h1>
        </div>

        {/* User Profile */}
        <div className="px-6 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium text-white">
              {userName.substring(0, 2).toUpperCase() || "CM"}
            </div>
            <span className="text-sm text-gray-300">{userName || "Carlos Martinez"}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6">
          <ul className="space-y-2">
            <li>
              <button className="w-full flex items-center px-4 py-2 text-sm text-white bg-primary-500 rounded-lg">
                <div className="w-4 h-4 mr-3 bg-white rounded-sm"></div>
                My Projects
              </button>
            </li>
            <li>
              <button className="w-full flex items-center px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                <Clock className="w-4 h-4 mr-3" />
                Recent
              </button>
            </li>
            <li>
              <button className="w-full flex items-center px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </button>
            </li>
            <li>
              <button className="w-full flex items-center px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
                <HelpCircle className="w-4 h-4 mr-3" />
                Help
              </button>
            </li>
          </ul>
        </nav>

        {/* Bottom Status */}
        <div className="p-6 border-t border-gray-800">
          <div className="space-y-2">
            <ServiceStatus />
            <span className="text-xs text-gray-500">MVP Version</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Header */}
        <header className="border-b border-gray-700/30 bg-[#000]">
          <div className="flex items-center justify-between px-8 py-6">
            <h1 className="text-2xl font-bold text-white font-mono">My Projects</h1>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search Project"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80 bg-gray-800 border-gray-700"
                />
              </div>
              
              <Button 
                onClick={() => setIsNewProjectModalOpen(true)}
                className="bg-primary-500 hover:bg-primary-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                NEW PROJECT
              </Button>
            </div>
          </div>
        </header>

        {/* Projects Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id}
                className="cursor-pointer hover:scale-105 transition-transform duration-200 bg-gray-900/50 border-gray-800"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                {/* Project Thumbnail */}
                <div className="aspect-[4/3] bg-gray-800 rounded-t-xl overflow-hidden">
                  <img 
                    src={project.thumbnail} 
                    alt={project.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to gradient if image fails to load
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        parent.innerHTML = '<div class="w-full h-full bg-gray-800 flex items-center justify-center"><div class="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center"><div class="w-10 h-10 bg-primary-400 rounded transform rotate-45"></div></div></div>'
                      }
                    }}
                  />
                </div>

                {/* Project Info */}
                <CardContent className="p-4 bg-gray-900">
                  <div className="text-xs text-gray-400 mb-1">
                    Updated: <span className="font-mono">{project.updated}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1 font-mono">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2 font-mono">
                    {project.description}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <div className="w-3 h-3 mr-1">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                    {project.location}
                  </div>

                  {/* Progress bar for projects with processing scans */}
                  {project.status === 'processing' && project.activeScans && project.activeScans > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-yellow-500">
                          {project.activeScans} scan{project.activeScans > 1 ? 's' : ''} processing
                        </span>
                        <span className="text-xs text-gray-400">
                          {project.processingProgress}%
                        </span>
                      </div>
                      <Progress 
                        value={project.processingProgress || 0} 
                        indicatorColor="bg-yellow-500"
                        className="h-1.5"
                      />
                    </div>
                  )}

                  {/* Status indicator for completed projects */}
                  {project.status === 'completed' && project.totalScans && project.totalScans > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-500 flex items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></div>
                          {project.totalScans} scan{project.totalScans > 1 ? 's' : ''} completed
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">
                {searchQuery ? "No projects found" : "Create your first project"}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery 
                  ? "Try different search terms" 
                  : "Start your videogrammetry journey by creating a new project"
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      <Modal 
        isOpen={isNewProjectModalOpen} 
        onClose={() => setIsNewProjectModalOpen(false)}
        title="New Project"
      >
        <ModalContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name <span className="text-red-400">Mandatory</span>
            </label>
            <Input
              placeholder="Project's name or title"
              value={newProject.name}
              onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-800 border-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-red-400">Mandatory</span>
            </label>
            <textarea
              placeholder="Project's short description"
              value={newProject.description}
              onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
              className="w-full h-24 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder:text-gray-400 focus:border-primary-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location <span className="text-red-400">Mandatory</span>
            </label>
            <Input
              placeholder="Search Location"
              value={newProject.location}
              onChange={(e) => setNewProject(prev => ({ ...prev, location: e.target.value }))}
              className="w-full bg-gray-800 border-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Space Type <span className="text-red-400">Mandatory</span>
            </label>
            <select
              value={newProject.spaceType}
              onChange={(e) => setNewProject(prev => ({ ...prev, spaceType: e.target.value }))}
              className="w-full h-12 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 focus:outline-none appearance-none"
            >
              <option value="" className="text-gray-400">Select the type of space you wish to scan</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
              <option value="outdoor">Outdoor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Type <span className="text-red-400">Mandatory</span>
            </label>
            <select
              value={newProject.projectType}
              onChange={(e) => setNewProject(prev => ({ ...prev, projectType: e.target.value }))}
              className="w-full h-12 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-primary-500 focus:outline-none appearance-none"
            >
              <option value="" className="text-gray-400">Select the type of project you're creating</option>
              <option value="new_build">New Build</option>
              <option value="renovation">Renovation</option>
              <option value="inspection">Inspection</option>
              <option value="documentation">Documentation</option>
            </select>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button
            onClick={handleCreateProject}
            disabled={!newProject.name.trim()}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50"
          >
            CREATE PROJECT
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}