<?php

/**
 * COLMAP App - Laravel Serverless Entry Point for Vercel
 * Optimized for Vercel serverless deployment
 */

try {
    // Optimize for serverless
    ini_set('memory_limit', '1024M');
    ini_set('max_execution_time', '300'); // 5 minutes max
    ini_set('display_errors', '1');
    ini_set('display_startup_errors', '1');
    error_reporting(E_ALL);

    // Define Laravel start
    define('LARAVEL_START', microtime(true));

    // Set base path
    $basePath = realpath(__DIR__ . '/../');
    if (!$basePath) {
        throw new Exception('Could not determine base path');
    }

    // Create writable temp directories for serverless
    $tempDirs = ['/tmp/cache', '/tmp/views', '/tmp/sessions', '/tmp/storage', '/tmp/bootstrap', '/tmp/bootstrap/cache'];
    foreach ($tempDirs as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }

    // Set Laravel cache paths for serverless
    $_ENV['APP_SERVICES_CACHE'] = '/tmp/bootstrap/cache/services.php';
    $_ENV['APP_PACKAGES_CACHE'] = '/tmp/bootstrap/cache/packages.php';
    $_ENV['APP_CONFIG_CACHE'] = '/tmp/bootstrap/cache/config.php';
    $_ENV['APP_ROUTES_CACHE'] = '/tmp/bootstrap/cache/routes.php';
    $_ENV['APP_EVENTS_CACHE'] = '/tmp/bootstrap/cache/events.php';

    // Set Laravel environment variables for serverless
    $_ENV['VIEW_COMPILED_PATH'] = '/tmp/views';
    $_ENV['CACHE_DRIVER'] = 'array';
    $_ENV['SESSION_DRIVER'] = 'cookie';

    // Check if autoload exists
    $autoloadPath = $basePath . '/vendor/autoload.php';
    if (!file_exists($autoloadPath)) {
        throw new Exception('Composer autoload not found at: ' . $autoloadPath);
    }
    require_once $autoloadPath;

    // Check if bootstrap exists  
    $bootstrapPath = $basePath . '/bootstrap/app.php';
    if (!file_exists($bootstrapPath)) {
        throw new Exception('Laravel bootstrap not found at: ' . $bootstrapPath);
    }
    $app = require_once $bootstrapPath;

    // Handle request
    $kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

    $response = $kernel->handle(
        $request = Illuminate\Http\Request::capture()
    );

    $response->send();

    $kernel->terminate($request, $response);

} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: text/plain');
    echo "Laravel Bootstrap Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
    echo "Base Path: " . ($basePath ?? 'undefined') . "\n";
    echo "Current Directory: " . __DIR__ . "\n";
} catch (Error $e) {
    http_response_code(500);
    header('Content-Type: text/plain');
    echo "PHP Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
}