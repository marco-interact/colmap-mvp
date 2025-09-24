<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Scan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'project_id',
        'video_filename',
        'video_path',
        'video_size',
        'frames_extracted',
        'status',
        'processing_results',
        'model_path',
        'thumbnail'
    ];

    protected $casts = [
        'processing_results' => 'array',
        'video_size' => 'integer',
        'frames_extracted' => 'integer'
    ];

    /**
     * Get the project that owns the scan.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the processing jobs for the scan.
     */
    public function processingJobs(): HasMany
    {
        return $this->hasMany(ProcessingJob::class);
    }

    /**
     * Get the latest processing job for the scan.
     */
    public function latestProcessingJob()
    {
        return $this->processingJobs()->latest()->first();
    }

    /**
     * Check if scan is currently processing.
     */
    public function isProcessing(): bool
    {
        return in_array($this->status, ['extracting', 'processing', 'uploading']);
    }

    /**
     * Check if scan is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Get formatted video size.
     */
    public function getFormattedVideoSizeAttribute(): string
    {
        if (!$this->video_size) {
            return 'N/A';
        }

        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = $this->video_size;
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}
