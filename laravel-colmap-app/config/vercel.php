<?php

/**
 * DoMapping - Vercel Deployment Configuration
 * 
 * This configuration file contains Vercel-specific settings
 * and optimizations for serverless deployment.
 */

return [

    /*
    |--------------------------------------------------------------------------
    | Serverless Environment Settings
    |--------------------------------------------------------------------------
    */
    
    'serverless_mode' => env('APP_ENV') === 'production',
    
    /*
    |--------------------------------------------------------------------------
    | COLMAP Service Integration
    |--------------------------------------------------------------------------
    */
    
    'colmap' => [
        'service_url' => env('COLMAP_SERVICE_URL', 'http://localhost:8001'),
        'default_quality' => env('COLMAP_DEFAULT_QUALITY', 'medium'),
        'timeout' => (int) env('COLMAP_TIMEOUT', 300),
        'max_file_size' => (int) env('MAX_FILE_SIZE', 1048576), // 1GB in KB
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Frontend Settings
    |--------------------------------------------------------------------------
    */
    
    'frontend' => [
        'brand_name' => 'DoMapping',
        'logo_text' => 'DoMapping',
        'theme' => 'dark',
        'accent_color' => '#4ade80',
    ],
    
    /*
    |--------------------------------------------------------------------------
    | File Upload Configuration
    |--------------------------------------------------------------------------
    */
    
    'uploads' => [
        'max_size' => (int) env('MAX_FILE_SIZE', 1048576), // 1GB in KB
        'allowed_extensions' => ['mp4', 'avi', 'mov', 'mkv'],
        'storage_disk' => env('FILESYSTEM_DISK', 'local'),
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Processing Configuration
    |--------------------------------------------------------------------------
    */
    
    'processing' => [
        'default_frame_rate' => 1,
        'quality_settings' => [
            'low' => [
                'max_image_size' => 800,
                'max_features' => 4000,
            ],
            'medium' => [
                'max_image_size' => 1200,
                'max_features' => 8000,
            ],
            'high' => [
                'max_image_size' => 1600,
                'max_features' => 12000,
            ],
            'extreme' => [
                'max_image_size' => 2400,
                'max_features' => 20000,
            ],
        ],
    ],

];
