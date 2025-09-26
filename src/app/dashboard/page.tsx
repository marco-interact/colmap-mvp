"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Clock, Settings, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Modal, ModalContent, ModalFooter } from "@/components/ui/modal"
import { ServiceStatus } from "@/components/service-status"

interface Project {
  id: string
  name: string
  description: string
  updated: string
  thumbnail: string
  location: string
}

interface Scan {
  id: string
  projectId: string
  name: string
  status: 'completed' | 'processing' | 'failed'
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

  const loadDashboardData = () => {
    // Demo projects matching the screenshots
    const demoProjects: Project[] = [
      {
        id: "1",
        name: "Demo Project 1",
        description: "Render scan for construction site",
        updated: "26-08-2025",
        location: "Monterrey",
        thumbnail: "/api/assets/sample-industrial.jpg" // This will be a 3D render preview
      },
      {
        id: "2", 
        name: "Demo Project 2",
        description: "Render scan for construction site",
        updated: "26-08-2025",
        location: "Monterrey",
        thumbnail: "/api/assets/sample-industrial.jpg"
      }
    ]
    
    setProjects(demoProjects)
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
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary-400">Colmap App</h1>
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
        <header className="border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center justify-between px-8 py-6">
            <h1 className="text-2xl font-bold text-white">My Projects</h1>
            
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
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                    {/* 3D Model Preview - for now showing colored background */}
                    <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="w-10 h-10 bg-primary-400 rounded transform rotate-45"></div>
                    </div>
                  </div>
                </div>

                {/* Project Info */}
                <CardContent className="p-4 bg-gray-900">
                  <div className="text-xs text-gray-400 mb-1">
                    Updated: {project.updated}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {project.description}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <div className="w-3 h-3 mr-1">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                    {project.location}
                  </div>
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