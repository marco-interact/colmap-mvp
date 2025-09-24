<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Collaboration extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'user_id',
        'role',
        'permissions',
        'invited_at',
        'joined_at',
        'invited_by'
    ];

    protected $casts = [
        'permissions' => 'array',
        'invited_at' => 'datetime',
        'joined_at' => 'datetime'
    ];

    /**
     * Get the project that owns the collaboration.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user that owns the collaboration.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who invited this collaboration.
     */
    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Check if collaboration is active (user has joined).
     */
    public function isActive(): bool
    {
        return $this->joined_at !== null;
    }

    /**
     * Check if user has specific permission in this project.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->role === 'owner') {
            return true;
        }

        $permissions = $this->permissions ?? [];
        return in_array($permission, $permissions);
    }

    /**
     * Check if user can edit project.
     */
    public function canEdit(): bool
    {
        return in_array($this->role, ['owner', 'editor']);
    }

    /**
     * Check if user can delete project.
     */
    public function canDelete(): bool
    {
        return $this->role === 'owner';
    }
}
