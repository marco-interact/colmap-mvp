import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Sidebar } from './Sidebar.tsx';
import { Header } from './Header.tsx';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--dm-background)' }}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'md-hide-xs md-hide-sm' : ''} ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0'}`}>
        {/* Header */}
        <Header 
          onMenuClick={toggleSidebar}
          user={user}
          onLogout={() => navigate('/login')}
        />
        
        {/* Page content */}
        <main style={{ minHeight: 'calc(100vh - 80px)' }}>
          <Outlet />
        </main>
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md-hide-md md-hide-lg md-hide-xl"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};


