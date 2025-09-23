<?php

/**
 * COLMAP App - Laravel Serverless Entry Point for Vercel
 * Optimized for Vercel serverless deployment
 */

/**
 * Initialize database for serverless environment
 */
function initializeDatabase($app) {
    try {
        $dbPath = '/tmp/database.sqlite';
        
        // Create SQLite database file if it doesn't exist
        if (!file_exists($dbPath)) {
            // Create an empty SQLite database with the basic structure
            $pdo = new PDO('sqlite:' . $dbPath);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Create basic tables needed for authentication
            $pdo->exec('
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    email_verified_at DATETIME,
                    password TEXT NOT NULL,
                    remember_token TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS projects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    location TEXT,
                    user_id INTEGER NOT NULL,
                    status TEXT DEFAULT "pending",
                    settings TEXT,
                    thumbnail TEXT,
                    total_scans INTEGER DEFAULT 0,
                    last_processed_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );
                
                CREATE TABLE IF NOT EXISTS scans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    project_id INTEGER NOT NULL,
                    video_filename TEXT,
                    video_path TEXT,
                    video_size INTEGER,
                    frames_extracted INTEGER DEFAULT 0,
                    status TEXT DEFAULT "pending",
                    processing_results TEXT,
                    model_path TEXT,
                    thumbnail TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (project_id) REFERENCES projects (id)
                );
                
                CREATE TABLE IF NOT EXISTS processing_jobs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id TEXT NOT NULL UNIQUE,
                    scan_id INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    status TEXT DEFAULT "pending",
                    progress INTEGER DEFAULT 0,
                    message TEXT,
                    request_data TEXT,
                    results TEXT,
                    started_at DATETIME,
                    completed_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (scan_id) REFERENCES scans (id)
                );
                
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    email TEXT PRIMARY KEY,
                    token TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    user_id INTEGER,
                    ip_address TEXT,
                    user_agent TEXT,
                    payload TEXT NOT NULL,
                    last_activity INTEGER NOT NULL,
                    INDEX(user_id),
                    INDEX(last_activity)
                );
            ');
            
            // Insert a default user for immediate functionality
            $hashedPassword = password_hash('password', PASSWORD_DEFAULT);
            $pdo->exec("
                INSERT OR IGNORE INTO users (name, email, password, email_verified_at)
                VALUES ('Carlos Martinez', 'carlos@domapping.com', '$hashedPassword', datetime('now'));
            ");
            
            // Insert sample project
            $pdo->exec("
                INSERT OR IGNORE INTO projects (name, description, location, user_id, status, total_scans, created_at, updated_at)
                VALUES (
                    'ITECSA Nave Industrial',
                    'Render de sitio de obra para Desarrollo Industrial',
                    'Playa del Carmen',
                    1,
                    'completed',
                    1,
                    datetime('now', '-7 days'),
                    datetime('now', '-2 days')
                );
            ");
            
            chmod($dbPath, 0644);
        }
    } catch (Exception $e) {
        // Log error but continue - the app should still work for basic functionality
        error_log("Database initialization failed: " . $e->getMessage());
    }
}

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

    // Initialize database for serverless
    initializeDatabase($app);

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