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
        <!-- Mobile Menu Toggle -->
        <button class="mobile-menu-toggle" id="mobile-menu-toggle">
            <div class="hamburger">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </button>

        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
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

        // Mobile menu functionality
        document.addEventListener('DOMContentLoaded', function() {
            const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
            const sidebar = document.getElementById('sidebar');
            const hamburger = mobileMenuToggle.querySelector('.hamburger');

            function toggleMobileMenu() {
                sidebar.classList.toggle('open');
                hamburger.classList.toggle('open');
            }

            function closeMobileMenu() {
                sidebar.classList.remove('open');
                hamburger.classList.remove('open');
            }

            // Toggle menu on button click
            mobileMenuToggle.addEventListener('click', toggleMobileMenu);

            // Close menu when clicking outside
            document.addEventListener('click', function(event) {
                if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                    if (!sidebar.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                        closeMobileMenu();
                    }
                }
            });

            // Close menu when clicking on nav links (mobile)
            if (window.innerWidth <= 768) {
                const navLinks = sidebar.querySelectorAll('.nav-link');
                navLinks.forEach(link => {
                    link.addEventListener('click', closeMobileMenu);
                });
            }

            // Handle window resize
            window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                    closeMobileMenu();
                }
            });

            // Handle touch gestures for mobile menu
            let touchStartX = 0;
            let touchEndX = 0;

            document.addEventListener('touchstart', function(event) {
                touchStartX = event.changedTouches[0].screenX;
            });

            document.addEventListener('touchend', function(event) {
                touchEndX = event.changedTouches[0].screenX;
                
                // Swipe right to open menu (only if menu is closed and swipe starts from left edge)
                if (touchStartX < 50 && touchEndX - touchStartX > 100 && !sidebar.classList.contains('open')) {
                    toggleMobileMenu();
                }
                
                // Swipe left to close menu (only if menu is open)
                else if (sidebar.classList.contains('open') && touchStartX - touchEndX > 100) {
                    closeMobileMenu();
                }
            });
        });

        // Responsive utilities
        window.DoMapping.responsive = {
            isMobile: function() {
                return window.innerWidth <= 768;
            },
            isTablet: function() {
                return window.innerWidth > 768 && window.innerWidth <= 1024;
            },
            isDesktop: function() {
                return window.innerWidth > 1024;
            }
        };

        // Add responsive classes to body for conditional styling
        function updateResponsiveClasses() {
            document.body.classList.remove('is-mobile', 'is-tablet', 'is-desktop');
            
            if (window.DoMapping.responsive.isMobile()) {
                document.body.classList.add('is-mobile');
            } else if (window.DoMapping.responsive.isTablet()) {
                document.body.classList.add('is-tablet');
            } else {
                document.body.classList.add('is-desktop');
            }
        }

        // Initial responsive class update
        updateResponsiveClasses();

        // Update on resize
        window.addEventListener('resize', updateResponsiveClasses);
    </script>
    
    @stack('scripts')
</body>
</html>