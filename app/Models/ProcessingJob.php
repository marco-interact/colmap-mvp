<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProcessingJob extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_id',
        'scan_id',
        'type',
        'status',
        'progress',
        'message',
        'request_data',
        'results',
        'started_at',
        'completed_at'
    ];

    protected $casts = [
        'request_data' => 'array',
        'results' => 'array',
        'progress' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime'
    ];

    /**
     * Get the scan that owns the processing job.
     */
    public function scan(): BelongsTo
    {
        return $this->belongsTo(Scan::class);
    }

    /**
     * Check if job is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if job is failed.
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Check if job is processing.
     */
    public function isProcessing(): bool
    {
        return in_array($this->status, ['pending', 'processing', 'running']);
    }

    /**
     * Get formatted duration.
     */
    public function getDurationAttribute(): ?string
    {
        if (!$this->started_at || !$this->completed_at) {
            return null;
        }

        $duration = $this->completed_at->diffInSeconds($this->started_at);
        
        if ($duration < 60) {
            return $duration . ' segundos';
        } elseif ($duration < 3600) {
            return round($duration / 60, 1) . ' minutos';
        } else {
            return round($duration / 3600, 1) . ' horas';
        }
    }
}
