<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('app.name', 'DoMapping') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:300,400,500,600,700&display=swap" rel="stylesheet" />
    <link href="https://fonts.bunny.net/css?family=jetbrains-mono:400,500,600&display=swap" rel="stylesheet" />

    <!-- Icons -->
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

    <!-- Styles -->
    @vite(['resources/less/app.less', 'resources/js/app.js'])
    
    @stack('styles')
</head>
<body>
    <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="logo">
                DoMapping
            </div>

            <div class="user-info">
                <div class="avatar">
                    {{ strtoupper(substr(Auth::user()->name ?? 'U', 0, 2)) }}
                </div>
                <div class="user-details">
                    <div class="name">{{ Auth::user()->name ?? 'Usuario' }}</div>
                    <div class="role">Profesional</div>
                </div>
            </div>

            <nav class="nav-menu">
                <ul>
                    <li class="nav-item">
                        <a href="{{ route('dashboard') }}" class="nav-link {{ request()->routeIs('dashboard') ? 'active' : '' }}">
                            <i data-lucide="folder" class="icon"></i>
                            Mis Proyectos
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="{{ route('projects.recent') }}" class="nav-link {{ request()->routeIs('projects.recent') ? 'active' : '' }}">
                            <i data-lucide="clock" class="icon"></i>
                            Recientes
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="{{ route('settings') }}" class="nav-link {{ request()->routeIs('settings') ? 'active' : '' }}">
                            <i data-lucide="settings" class="icon"></i>
                            Configuración
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="{{ route('help') }}" class="nav-link {{ request()->routeIs('help') ? 'active' : '' }}">
                            <i data-lucide="help-circle" class="icon"></i>
                            Ayuda
                        </a>
                    </li>
                </ul>
            </nav>

            <div class="version-info">
                Demo Version
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            @yield('content')
        </main>
    </div>

    <!-- Global Modals -->
    <div id="modal-container"></div>

    <!-- Scripts -->
    <script>
        // Initialize Lucide icons
        lucide.createIcons();
        
        // Global app object
        window.DoMapping = {
            csrfToken: document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            user: @json(Auth::user() ?? null),
            routes: {
                dashboard: '{{ route("dashboard") }}',
                projects: {
                    index: '{{ route("projects.index") }}',
                    create: '{{ route("projects.create") }}',
                    store: '{{ route("projects.store") }}',
                }
            }
        };
    </script>
    
    @stack('scripts')
</body>
</html>