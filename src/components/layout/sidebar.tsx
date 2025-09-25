'use client'

import { motion } from 'framer-motion'
import { 
  FolderOpen, 
  Clock, 
  Settings, 
  HelpCircle,
  User
} from 'lucide-react'

interface SidebarProps {
  activeItem?: string
}

export function Sidebar({ activeItem = 'projects' }: SidebarProps) {
  const navigationItems = [
    {
      id: 'projects',
      label: 'Mis Proyectos',
      icon: FolderOpen,
      href: '/dashboard'
    },
    {
      id: 'recent',
      label: 'Recientes',
      icon: Clock,
      href: '/dashboard/recent'
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
      href: '/dashboard/settings'
    },
    {
      id: 'help',
      label: 'Ayuda',
      icon: HelpCircle,
      href: '/help'
    }
  ]

  return (
    <div className="w-64 bg-gray-800 flex flex-col h-screen">
      <div className="p-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-mono font-bold text-green-500 mb-8">
            Colmap App
          </h2>
        </motion.div>

        {/* User Profile */}
        <motion.div 
          className="flex items-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center mr-3">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-mono text-sm">Carlos Martinez</span>
        </motion.div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navigationItems.map((item, index) => {
            const Icon = item.icon
            const isActive = activeItem === item.id
            
            return (
              <motion.a
                key={item.id}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg font-mono text-sm transition-colors duration-200 ${
                  isActive 
                    ? 'bg-green-500 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </motion.a>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <motion.div 
        className="mt-auto p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <p className="text-gray-500 text-xs font-mono">Demo Version</p>
      </motion.div>
    </div>
  )
}
