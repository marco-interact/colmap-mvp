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
    </div>
    
    <div class="project-info">
        <div class="project-meta">
            Actualizado: {{ $project->updated_at->format('d-m-Y') }}
        </div>
        
        <div class="project-title">{{ $project->name }}</div>
        
        @if($project->description)
            <div class="project-description">{{ $project->description }}</div>
        @endif
        
        @if($project->location)
            <div class="project-location">
                <i data-lucide="map-pin" class="icon"></i>
                {{ $project->location }}
            </div>
        @endif
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
