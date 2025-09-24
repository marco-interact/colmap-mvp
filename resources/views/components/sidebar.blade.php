{{-- Sidebar Component --}}
@props(['active' => ''])

<div class="sidebar" id="sidebar">
    <div class="sidebar-header">
        <a href="{{ route('dashboard') }}" class="brand-logo">
            DoMapping
        </a>
        
        <div class="user-profile">
            <div class="user-avatar">
                {{ substr(Auth::user()->name, 0, 2) }}
            </div>
            <div class="user-name">
                {{ Auth::user()->name }}
            </div>
        </div>
    </div>
    
    <nav class="sidebar-nav">
        <a href="{{ route('dashboard') }}" 
           class="nav-link {{ $active === 'projects' ? 'active' : '' }}">
            <i data-lucide="folder"></i>
            Mis Proyectos
        </a>
        
        <a href="#" class="nav-link {{ $active === 'recent' ? 'active' : '' }}">
            <i data-lucide="clock"></i>
            Recientes
        </a>
        
        <a href="#" class="nav-link {{ $active === 'settings' ? 'active' : '' }}">
            <i data-lucide="settings"></i>
            Configuración
        </a>
        
        <a href="#" class="nav-link {{ $active === 'help' ? 'active' : '' }}">
            <i data-lucide="help-circle"></i>
            Ayuda
        </a>
    </nav>
    
    <div class="sidebar-footer">
        Demo Version
    </div>
</div>
