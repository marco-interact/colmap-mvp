'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FolderOpen, 
  Clock, 
  Settings, 
  HelpCircle,
  LogOut
} from 'lucide-react'

interface SidebarProps {
  user?: {
    name: string
    email: string
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/dashboard',
      label: 'My Projects',
      icon: FolderOpen,
      active: pathname === '/dashboard'
    },
    {
      href: '/dashboard/recent',
      label: 'Recent',
      icon: Clock,
      active: pathname === '/dashboard/recent'
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: Settings,
      active: pathname === '/dashboard/settings'
    },
    {
      href: '/help',
      label: 'Help',
      icon: HelpCircle,
      active: pathname === '/help'
    }
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <Link href="/dashboard" className="sidebar-brand">
          Colmap App
        </Link>
      </div>

      {/* User Info */}
      {user && (
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
              {user.name}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${item.active ? 'active' : ''}`}
            >
              <Icon />
              {item.label}
            </Link>
          )
        })}
        
        <button
          onClick={handleLogout}
          className="sidebar-nav-item"
          style={{ 
            background: 'none', 
            border: 'none', 
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <LogOut />
          Sign Out
        </button>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        Demo Version
      </div>
    </div>
  )
}
