<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ $title ?? 'Iniciar Sesión' }} - {{ config('app.name', 'DoMapping') }}</title>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:300,400,500,600,700&display=swap" rel="stylesheet" />
    <link href="https://fonts.bunny.net/css?family=jetbrains-mono:400,500,600&display=swap" rel="stylesheet" />

    <!-- Icons -->
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

    <!-- Styles -->
    @if (app()->environment('production'))
        <link href="{{ asset('build/assets/app-DjjJYP4c.css') }}" rel="stylesheet">
        <script src="{{ asset('build/assets/app-Bj43h_rG.js') }}" defer></script>
    @else
        @vite(['resources/less/app.less', 'resources/js/app.js'])
    @endif
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-logo">
                <h1>DoMapping</h1>
                <p>Plataforma de Visualización 3D</p>
            </div>

            @yield('content')
        </div>
    </div>

    <script>
        // Initialize Lucide icons
        lucide.createIcons();
    </script>
</body>
</html>
