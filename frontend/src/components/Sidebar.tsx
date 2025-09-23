// components/Sidebar.tsx
// Responsive sidebar with user profile and navigation menu
// Collapses to bottom navigation on mobile devices

import React from 'react';
import { 
  FolderOpen, 
  Clock, 
  Settings, 
  HelpCircle, 
  X 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { 
      icon: FolderOpen, 
      label: 'Mis Proyectos', 
      href: '/projects', 
      active: true 
    },
    { 
      icon: Clock, 
      label: 'Recientes', 
      href: '/recent', 
      active: false 
    },
    { 
      icon: Settings, 
      label: 'Configuración', 
      href: '/settings', 
      active: false 
    },
    { 
      icon: HelpCircle, 
      label: 'Ayuda', 
      href: '/help', 
      active: false 
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-80 lg:fixed lg:inset-y-0 bg-gray-900 border-r border-gray-800">
        {/* User Profile Section */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-800">
          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-semibold">CM</span>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Carlos Martinez</h3>
            <p className="text-gray-400 text-xs">carlos@domapping.com</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${item.active 
                    ? 'bg-emerald-400 text-black' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }
                `}
                aria-current={item.active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Version Info */}
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500">Demo Version</p>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`
          lg:hidden fixed inset-0 z-50 transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      >
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
          aria-hidden="true"
        />
        
        <div 
          className={`
            absolute left-0 top-0 h-full w-80 bg-gray-900 transform transition-transform duration-300
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-emerald-400 text-xl font-bold">DoMapping</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Section */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-800">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">CM</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Carlos Martinez</h3>
              <p className="text-gray-400 text-xs">carlos@domapping.com</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${item.active 
                      ? 'bg-emerald-400 text-black' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }
                  `}
                  aria-current={item.active ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-2">
        <div className="flex justify-around">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-lg transition-colors
                  ${item.active 
                    ? 'text-emerald-400' 
                    : 'text-gray-400 hover:text-white'
                  }
                `}
                aria-current={item.active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
};