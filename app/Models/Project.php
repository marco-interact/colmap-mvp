<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description', 
        'location',
        'status',
        'user_id',
        'settings',
        'thumbnail',
        'total_scans',
        'last_processed_at'
    ];

    protected $casts = [
        'settings' => 'array',
        'last_processed_at' => 'datetime'
    ];

    /**
     * Get the user that owns the project.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the scans for the project.
     */
    public function scans(): HasMany
    {
        return $this->hasMany(Scan::class);
    }

    /**
     * Get completed scans count
     */
    public function getCompletedScansCountAttribute(): int
    {
        return $this->scans()->where('status', 'completed')->count();
    }

    /**
     * Check if project has any processing scans
     */
    public function hasProcessingScans(): bool
    {
        return $this->scans()->whereIn('status', ['processing', 'extracting'])->exists();
    }
}
