<?php

/**
 * DoMapping - Laravel Serverless Entry Point for Vercel
 * 
 * This file serves as the entry point for Laravel applications 
 * running on Vercel's serverless platform.
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define path constants
define('LARAVEL_START', microtime(true));

// Set the correct base path for serverless environment
$basePath = realpath(__DIR__ . '/../');

// Require the Composer autoloader
require_once $basePath . '/vendor/autoload.php';

// Bootstrap Laravel application
$app = require_once $basePath . '/bootstrap/app.php';

// Handle the request
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

// Send the response
$response->send();

// Terminate the kernel
$kernel->terminate($request, $response);
