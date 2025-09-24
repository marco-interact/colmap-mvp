{{-- Project Card Component --}}
@props(['project'])

<div class="project-card" onclick="location.href='{{ route('projects.show', $project) }}'">
    <div class="project-thumbnail">
        @if($project->name === 'ITECSA Nave Industrial')
            <div class="sample-3d-preview">
                <!-- CSS-generated 3D industrial building preview -->
                <div class="building-complex">
                    <div class="main-building"></div>
                    <div class="side-building"></div>
                    <div class="warehouse"></div>
                    <div class="ground-plane"></div>
                </div>
            </div>
        @elseif($project->thumbnail)
            <img src="{{ asset('storage/' . $project->thumbnail) }}" alt="{{ $project->name }}">
        @else
            <div class="no-image">
                <i data-lucide="folder" style="width: 48px; height: 48px;"></i>
            </div>
        @endif
        
        <div class="project-status">
            <span class="status-badge status-{{ $project->status }}">
                @switch($project->status)
                    @case('completed')
                        <i data-lucide="check-circle"></i>
                        Completado
                        @break
                    @case('processing')
                        <i data-lucide="loader" class="spin"></i>
                        Procesando
                        @break
                    @case('pending')
                        <i data-lucide="clock"></i>
                        Pendiente
                        @break
                    @default
                        <i data-lucide="circle"></i>
                        {{ ucfirst($project->status) }}
                @endswitch
            </span>
        </div>
    </div>

    <div class="project-info">
        <div class="project-header">
            <h3 class="project-name">{{ $project->name }}</h3>
            @if($project->location)
                <div class="project-location">
                    <i data-lucide="map-pin"></i>
                    {{ $project->location }}
                </div>
            @endif
        </div>

        @if($project->description)
            <p class="project-description">{{ Str::limit($project->description, 100) }}</p>
        @endif

        <div class="project-stats">
            <div class="stat">
                <i data-lucide="scan"></i>
                <span>{{ $project->total_scans }} {{ Str::plural('scan', $project->total_scans) }}</span>
            </div>
            @if($project->last_processed_at)
                <div class="stat">
                    <i data-lucide="calendar"></i>
                    <span>{{ $project->last_processed_at->diffForHumans() }}</span>
                </div>
            @endif
        </div>

        <div class="project-actions">
            <button type="button" class="btn-secondary btn-sm" onclick="event.stopPropagation(); editProject({{ $project->id }})">
                <i data-lucide="edit-3"></i>
                Editar
            </button>
            <button type="button" class="btn-primary btn-sm" onclick="event.stopPropagation(); viewProject({{ $project->id }})">
                <i data-lucide="eye"></i>
                Ver Detalles
            </button>
        </div>
    </div>
</div>

@pushOnce('scripts')
<script>
function editProject(projectId) {
    // TODO: Open edit project modal
    console.log('Edit project:', projectId);
}

function viewProject(projectId) {
    window.location.href = `/projects/${projectId}`;
}
</script>
@endPushOnce
