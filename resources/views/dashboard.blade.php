@extends('layouts.app', ['active' => 'projects'])

@section('topbar')
<x-topbar title="Mis Proyectos" />
@endsection

@section('content')

<div class="projects-grid" id="projects-grid">
    @forelse($projects as $project)
        <x-project-card :project="$project" />
    @empty
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
            <i data-lucide="folder-plus" style="width: 64px; height: 64px; color: #6b7280; margin-bottom: 1rem;"></i>
            <h3 style="color: #a3a3a3; margin-bottom: 0.5rem;">No hay proyectos aún</h3>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">Crea tu primer proyecto para comenzar</p>
            <button type="button" class="btn-primary" onclick="openModal('create-project-modal')">
                <i data-lucide="plus" class="icon"></i>
                Crear Primer Proyecto
            </button>
        </div>
    @endforelse
</div>

<!-- Create Project Modal -->
<x-project-modal />
@endsection

@push('scripts')
<script>

function submitCreateProject() {
    const form = document.getElementById('create-project-form');
    const formData = new FormData(form);
    
    // Show loading state
    const submitBtn = event.target;
    submitBtn.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    submitBtn.disabled = true;
    
    fetch(window.DoMapping.routes.projects.store, {
        method: 'POST',
        headers: {
            'X-CSRF-TOKEN': window.DoMapping.csrfToken,
            'Accept': 'application/json',
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload page to show new project
            window.location.reload();
        } else {
            // Handle validation errors
            console.error('Error creating project:', data.errors);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    })
    .finally(() => {
        submitBtn.innerHTML = 'CREAR PROYECTO';
        submitBtn.disabled = false;
    });
}

function viewProject(projectId) {
    window.location.href = `/projects/${projectId}`;
}

// Search functionality
document.getElementById('project-search').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        const title = card.querySelector('.project-title').textContent.toLowerCase();
        const description = card.querySelector('.project-description').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// Modal functionality handled by the modal component

// Initialize icons after modal content changes
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
});
</script>
@endpush
