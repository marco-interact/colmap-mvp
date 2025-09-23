import React from 'react';
import { Menu, LogOut, User } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  user: UserType | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, user, onLogout }) => {
  return (
    <header className="md-surface shadow-sm border-b border-gray-200 md-padding-md">
      <div className="md-container">
        <div className="md-flex md-align-center md-justify-between">
          {/* Left side */}
          <div className="md-flex md-align-center" style={{gap: '16px'}}>
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors md-hide-lg md-hide-xl"
            >
              <Menu size={20} />
            </button>
            
            <div>
              <h1 className="md-title-large md-hide-xs">
                3D Visualization Platform
              </h1>
              <h1 className="md-title-medium md-show-xs md-hide-sm md-hide-md md-hide-lg md-hide-xl">
                3D Platform
              </h1>
              <p className="md-body-small md-hide-xs" style={{color: '#6b7280'}}>
                Create detailed 3D models from video captures
              </p>
            </div>
          </div>
        
          {/* Right side */}
          <div className="md-flex md-align-center" style={{gap: '16px'}}>
            {/* User info */}
            <div className="md-flex md-align-center" style={{gap: '12px'}}>
              <div className="w-8 h-8 md-primary-container rounded-full md-flex md-align-center md-justify-center">
                <User size={16} style={{color: '#6750a4'}} />
              </div>
              <div className="md-hide-xs">
                <p className="md-body-medium font-medium">
                  {user?.full_name || user?.username}
                </p>
                <p className="md-body-small" style={{color: '#6b7280'}}>
                  {user?.email}
                </p>
              </div>
            </div>
            
            {/* Logout button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-md text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


