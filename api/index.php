<?php

/**
 * DoMapping - Laravel Serverless Entry Point for Vercel
 * Optimized for Vercel serverless deployment
 */

// Optimize for serverless
ini_set('memory_limit', '1024M');
ini_set('max_execution_time', '300'); // 5 minutes max

// Define Laravel start
define('LARAVEL_START', microtime(true));

// Set base path
$basePath = realpath(__DIR__ . '/../');

// Create writable temp directories for serverless
$tempDirs = ['/tmp/cache', '/tmp/views', '/tmp/sessions', '/tmp/storage'];
foreach ($tempDirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Set Laravel environment variables for serverless
$_ENV['VIEW_COMPILED_PATH'] = '/tmp/views';
$_ENV['CACHE_DRIVER'] = 'array';
$_ENV['SESSION_DRIVER'] = 'cookie';

// Autoload
require_once $basePath . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once $basePath . '/bootstrap/app.php';

// Handle request
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

$response->send();

$kernel->terminate($request, $response);